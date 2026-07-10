# [구현 계획서] watchdog-hq: 통합 구현 계획서

본 문서는 상용 SaaS 가용성 모니터링 서비스 `watchdog-hq`의 웹 포털(Next.js) 구축과 분산 측정 엔진 `watchdog-server`(기존 `go-watchdog/server`)의 리팩토링을 아우르는 최종 통합 구현 계획서입니다.

---

## 1. 개요 및 구현 범위

* **웹 포털 (watchdog-hq):** 회원 로그인, 요금제 구독 처리(Stripe), 가용성 설정 관리 및 외부 Go Checker 데이터 보고 수신, 권한 제어 및 마스킹 대시보드 개발.
* **측정 노드 (go-watchdog/server ➡️ watchdog-server 리팩토링):** 로컬 DB(SQLite) 및 웹 서버 코드를 완전 제거하고, 중앙 Next.js API와 연동하여 감시 대상을 폴링하고 측정 결과를 벌크로 보고하는 초경량 가용성 수집 데몬으로 개조.

---

## 2. 생성 및 수정 파일 목록 (Proposed File Changes)

### 2.1 [Go Checker] 측정 엔진 리팩토링 (`h:/lee/go-watchdog/`)
* **[DELETE] `db.go`, `handler.go`, `notifier.go`:**
  * 로컬 SQLite 연동, 웹 API 라우팅 및 개별 알림 모듈을 제거합니다. (해당 역할은 모두 Next.js 서버로 위임)
* **[MODIFY] [server/health_runner.go](file:///h:/lee/go-watchdog/server/health_runner.go):**
  * 스케줄러가 DB 대신 중앙 Next.js API(`GET /api/checker/targets`)를 호출하여 모니터링할 최신 리스트를 가져오도록 수정.
  * 결과를 로컬 DB에 쓰지 않고, REST API(`POST /api/checker/report`)를 통해 중앙 서버로 벌크 전송하도록 리팩토링.
* **[MODIFY] [server/main.go](file:///h:/lee/go-watchdog/server/main.go):**
  * 불필요한 웹 UI 서빙 및 API 바인딩을 제거하고, 순수 백그라운드 Checker 데몬으로만 실행되도록 메인 함수 정리.

### 2.2 [Next.js 웹 포털] 데이터 및 라이브러리 레이어 (`h:/lee/watchdog-hq/src/lib/`)
* **[NEW] [db.ts](file:///h:/lee/watchdog-hq/src/lib/db.ts):**
  * PostgreSQL 풀(Connection Pool)을 초기화하고 쿼리 실행을 돕는 `pg` 라이브러리 연동 헬퍼 모듈.

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

### 2.5 [Next.js 웹 포털] 콘솔 대시보드 페이지 레이어 (`h:/lee/watchdog-hq/src/app/dashboard/`)
* **[NEW] [page.tsx](file:///h:/lee/watchdog-hq/src/app/dashboard/page.tsx):**
  * 탭 메뉴를 통해 서버 모니터링과 API 헬스체크를 넘나들 수 있는 메인 관제 센터 뷰.

---

## 3. 검증 및 테스트 시나리오 (Verification Plan)

### 3.1 수집 노드 연동 (Checker Integration) 검증
1. **Go Checker ↔ Next.js 로컬 통신 테스트:**
   * 개조된 Go Checker 데몬을 실행하고, Next.js 개발 서버(`3088` 포트)와 정상적으로 토큰 인증 규격(`X-Checker-Token`) 하에서 대상 동기화 및 보고 통신이 에러 없이 주기적으로 도는지 검증.
2. **보안 확인:**
   * 헤더에 잘못된 토큰을 실어 전송했을 때 `401 Unauthorized` 에러가 응답에 담겨 반려되는지 확인.

### 3.2 어드민 권한 제어 및 마스킹 검증
1. **무인가자 (Viewer) 시나리오:**
   * 로그인 세션 쿠키 없이 `/api/health/status`를 요청하여, 리턴되는 JSON 데이터의 `url` 속성이 전부 `"Hidden (Admin Only)"`로 가려져 오는지 확인.
   * 대시보드 페이지에서 `[➕ API 등록]` 버튼과 휴지통 단추가 감춰져 노출되지 않는지 확인.
2. **관리자 (Admin) 시나리오:**
   * `/?token=xxx` 파라미터로 마스터 세션을 획득한 후 `/api/health/status`를 요청하여 실제 URL이 파란색 링크로 잘 열리는지 확인.
   * 신규 대상을 등록하고 삭제했을 때 DB의 데이터 상태가 즉각 연동 갱신되는지 확인.
