# [구현 계획서] watchdog-hq: 통합 구현 계획서

본 문서는 상용 SaaS 가용성 모니터링 서비스 `watchdog-hq`의 웹 포털(Next.js) 구축과 분산 측정 엔진 `watchdog-checker`(기존 `server`는 보존하고 신규 독립 폴더 `checker`에 개발) 구축을 위한 최종 통합 구현 계획서입니다.

---

## 1. 개요 및 구현 범위

* **웹 포털 (watchdog-hq):** 회원 로그인, 요금제 구독 처리(Stripe), 가용성 설정 관리 및 외부 Go Checker 데이터 보고 수신, 권한 제어 및 마스킹 대시보드 개발.
* **측정 노드 (go-watchdog/checker/ [신설]):** 
  * 기존 단독 설치형 서버(`go-watchdog/server`)의 소스 코드는 **훼손 없이 원본 그대로 보존**합니다.
  * 대신, SaaS 전용으로 작동할 초경량 **`checker` 모듈**을 별도의 독립 폴더에 완전히 신규 개발하여 분산형 수집기로 사용합니다.

---

## 2. 생성 및 수정 파일 목록 (Proposed File Changes)

### 2.1 [Go Checker] 독립 수집기 신설 (`h:/lee/go-watchdog/`)
기존 `server/` 코드는 원본 그대로 보존하며, 아래 신규 디렉토리 및 파일을 추가하여 Checker 데몬을 구축합니다.

* **[NEW] [checker/main.go](file:///h:/lee/go-watchdog/checker/main.go):**
  * `config.json`의 중앙 포털 URL 및 보안 토큰을 읽어 `targets`를 동기화하고 측정을 시작하는 Checker 데몬의 진입점.
* **[NEW] [checker/runner.go](file:///h:/lee/go-watchdog/checker/runner.go):**
  * 중앙 API(`GET /api/checker/targets`)로 타겟을 주기적으로 Fetch하고, 로컬 Go 루틴을 통해 가용성 측정 후 결과를 중앙 API(`POST /api/checker/report`)로 비동기 벌크 리포트하는 스케줄링 러너 엔진.
* **[NEW] [checker/config.json](file:///h:/lee/go-watchdog/checker/config.json):**
  * Checker 노드 전용 로컬 설정 파일 (중앙 웹 서버 URL 및 `X-Checker-Token` 설정값 보관).

### 2.2 [Next.js 웹 포털] 데이터 및 라이브러리 레이어 (`h:/lee/watchdog-hq/`)
* **[NEW] [db.ts](file:///h:/lee/watchdog-hq/src/lib/db.ts):**
  * PostgreSQL 풀(Connection Pool)을 초기화하고 쿼리 실행을 돕는 `pg` 라이브러리 연동 헬퍼 모듈.
* **[NEW] [init.sql](file:///h:/lee/watchdog-hq/scripts/init.sql):**
  * PostgreSQL 데이터베이스에 테이블 스키마(users, subscriptions, targets, logs) 및 복합 인덱스를 최초 적재할 데이터 마이그레이션 스크립트.

### 2.3 [Next.js 웹 포털] 백엔드 API 레이어 (`h:/lee/watchdog-hq/src/app/api/`)
* **[NEW] [route.ts (targets)](file:///h:/lee/watchdog-hq/src/app/api/checker/targets/route.ts):**
  * `X-Checker-Token` 헤더를 검증하고, Go Checker가 가져갈 활성 감시 대상 리스트를 JSON으로 반환하는 API 엔드포인트.
* **[NEW] [route.ts (report)](file:///h:/lee/watchdog-hq/src/app/api/checker/report/route.ts):**
  * Go Checker가 측정한 가용성 벌크 결과를 전송받아 DB `health_logs`에 일괄 기입하는 API 엔드포인트.
* **[NEW] [route.ts (status)](file:///h:/lee/watchdog-hq/src/app/api/health/status/route.ts):**
  * 대시보드에서 실시간 Uptime 상태 및 10회 히스토리를 그리기 위한 API. 세션 검증 결과에 따라 URL을 마스킹하여 반환.
* **[NEW] [route.ts (health-targets)](file:///h:/lee/watchdog-hq/src/app/api/health/targets/route.ts):**
  * 어드민 전용 헬스체크 타겟 등록(`POST`) 및 삭제(`DELETE`) 관리 API.

### 2.4 [Next.js 웹 포털] 프론트엔드 컴포넌트 레이어 (`h:/lee/watchdog-hq/src/components/`)
* **[NEW] [APICard.tsx](file:///h:/lee/watchdog-hq/src/components/APICard.tsx):**
  * Uptime, Latency, 응답 코드 및 최근 10회 LED 히스토리 도트를 그리는 반응형 컴포넌트. (권한에 따라 삭제 버튼 숨김 처리 내장)
* **[NEW] [RegisterModal.tsx](file:///h:/lee/watchdog-hq/src/components/RegisterModal.tsx):**
  * 어드민 유저가 신규 헬스체크 대상을 입력할 수 있도록 띄워주는 슬라이드 형태의 글래스모피즘 모달 컴포넌트.

### 2.5 [Next.js 웹 포털] 콘솔 대시보드 페이지 레이어 (`h:/lee/watchdog-hq/src/app/`)
* **[NEW] [page.tsx](file:///h:/lee/watchdog-hq/src/app/dashboard/page.tsx):**
  * 탭 메뉴를 통해 서버 모니터링과 API 헬스체크를 넘나들 수 있는 메인 관제 센터 뷰.
* **[MODIFY] [layout.tsx](file:///h:/lee/watchdog-hq/src/app/layout.tsx):**
  * 디자인 가이드에 정의된 미래적 감각의 구글 폰트 **Outfit**(제목용) 및 **Inter**(본문용) 주입 및 메타데이터 정의.
* **[MODIFY] [globals.css](file:///h:/lee/watchdog-hq/src/app/globals.css):**
  * Aurora Glow(배경 블러 광원 효과), 글래스모피즘 변수, 펄스 파동 애니메이션 스타일시트 정의 이식.

---

## 3. 검증 및 테스트 시나리오 (Verification Plan)

### 3.1 수집 노드 연동 (Checker Integration) 검증
1. **Go Checker ↔ Next.js 로컬 통신 테스트:**
   * `checker/` 하위에 새로 구성된 Go Checker 데몬을 실행하고, Next.js 개발 서버(`3088` 포트)와 정상적으로 토큰 인증 규격(`X-Checker-Token`) 하에서 대상 동기화 및 보고 통신이 에러 없이 주기적으로 도는지 검증.
2. **보안 확인:**
   * 헤더에 잘못된 토큰을 실어 전송했을 때 `401 Unauthorized` 에러가 응답에 담겨 반려되는지 확인.

### 3.2 어드민 권한 제어 및 마스킹 검증
1. **무인가자 (Viewer) 시나리오:**
   * 로그인 세션 쿠키 없이 `/api/health/status`를 요청하여, 리턴되는 JSON 데이터의 `url` 속성이 전부 `"Hidden (Admin Only)"`로 가려져 오는지 확인.
   * 대시보드 페이지에서 `[➕ API 등록]` 버튼과 휴지통 단추가 감춰져 노출되지 않는지 확인.
2. **관리자 (Admin) 시나리오:**
   * `/?token=xxx` 파라미터로 마스터 세션을 획득한 후 `/api/health/status`를 요청하여 실제 URL이 파란색 링크로 잘 열리는지 확인.
   * 신규 대상을 등록하고 삭제했을 때 DB의 데이터 상태가 즉각 연동 갱신되는지 확인.
