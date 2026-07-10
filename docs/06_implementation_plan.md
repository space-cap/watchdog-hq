# [구현 계획서] watchdog-hq: 통합 구현 계획서

본 문서는 상용 SaaS 가용성 모니터링 서비스 `watchdog-hq`의 웹 포털(Next.js) 및 API 모듈 구축을 위한 최종 통합 구현 계획서입니다. MVP(최소 기능 제품) 런칭을 목표로 개발 스코프, 생성 파일 리스트 및 검증 방식을 확정합니다.

---

## 1. 개요 및 구현 범위

* **목표:** 회원 로그인, 가용성 설정 관리, 외부 Go Checker 데이터 보고 수신, 실시간 대시보드 화면 및 요금제 구독 처리(Stripe)를 포괄하는 상용 모니터링 포털 개발.
* **우선 순위:** 비인가자의 무단 CRUD 차단 및 URL 마스킹을 통한 데이터 보안 설정을 기본 탑재합니다.

---

## 2. 생성 및 수정 파일 목록 (Proposed File Changes)

SaaS 시스템의 각 레이어를 Next.js (App Router) 구조에 맞춰 새롭게 생성하고 구성합니다.

### 2.1 데이터베이스 및 라이브러리 레이어 (`src/lib/`)
* **[NEW] [db.ts](file:///H:/lee/watchdog-hq/src/lib/db.ts):**
  * PostgreSQL 풀(Connection Pool)을 초기화하고 쿼리 실행을 돕는 `pg` 라이브러리 연동 헬퍼 모듈.

### 2.2 백엔드 API 레이어 (`src/app/api/`)
* **[NEW] [route.ts (targets)](file:///H:/lee/watchdog-hq/src/app/api/checker/targets/route.ts):**
  * `X-Checker-Token` 헤더를 검증하고, Go Checker가 가져갈 활성 감시 대상 리스트를 JSON으로 반환하는 API 엔드포인트.
* **[NEW] [route.ts (report)](file:///H:/lee/watchdog-hq/src/app/api/checker/report/route.ts):**
  * Go Checker가 측정한 가용성 벌크 결과를 전송받아 DB `health_logs`에 일괄 기입하는 API 엔드포인트.
* **[NEW] [route.ts (status)](file:///H:/lee/watchdog-hq/src/app/api/health/status/route.ts):**
  * 대시보드에서 실시간 Uptime 상태 및 10회 히스토리를 그리기 위한 API. 세션 검증 결과에 따라 URL을 마스킹하여 반환.
* **[NEW] [route.ts (health-targets)](file:///H:/lee/watchdog-hq/src/app/api/health/targets/route.ts):**
  * 어드민 전용 헬스체크 타겟 등록(`POST`) 및 삭제(`DELETE`) 관리 API.

### 2.3 프론트엔드 컴포넌트 레이어 (`src/components/`)
* **[NEW] [APICard.tsx](file:///H:/lee/watchdog-hq/src/components/APICard.tsx):**
  * 개별 서비스의 Uptime, Latency, 응답 코드 및 최근 10회 LED 히스토리 도트를 그리는 반응형 컴포넌트. (권한에 따라 삭제 버튼 숨김 처리 내장)
* **[NEW] [RegisterModal.tsx](file:///H:/lee/watchdog-hq/src/components/RegisterModal.tsx):**
  * 어드민 유저가 신규 헬스체크 대상을 입력할 수 있도록 띄워주는 슬라이드 형태의 글래스모피즘 모달 컴포넌트.

### 2.4 콘솔 대시보드 페이지 레이어 (`src/app/dashboard/`)
* **[NEW] [page.tsx](file:///H:/lee/watchdog-hq/src/app/dashboard/page.tsx):**
  * 탭 메뉴를 통해 서버 모니터링과 API 헬스체크를 넘나들 수 있는 메인 관제 센터 뷰.

---

## 3. 검증 및 테스트 시나리오 (Verification Plan)

### 3.1 수집 노드 연동 (Checker Integration) 검증
1. **Mock Data 테스트:**
   * Postman 또는 curl 툴을 사용하여 `GET /api/checker/targets`를 요청하여 JSON 구조가 정상 수신되는지 확인.
   * `POST /api/checker/report`로 가짜 헬스체크 결과를 쏘아 데이터베이스 `health_logs`에 정상 기입되는지 검증.
2. **보안 확인:**
   * 헤더에 잘못된 토큰을 실어 전송했을 때 `401 Unauthorized` 에러가 응답에 담겨 반려되는지 확인.

### 3.2 어드민 권한 제어 및 마스킹 검증
1. **무인가자 (Viewer) 시나리오:**
   * 로그인 세션 쿠키 없이 `/api/health/status`를 요청하여, 리턴되는 JSON 데이터의 `url` 속성이 전부 `"Hidden (Admin Only)"`로 가려져 오는지 확인.
   * 대시보드 페이지에서 `[➕ API 등록]` 버튼과 휴지통 단추가 감춰져 노출되지 않는지 확인.
2. **관리자 (Admin) 시나리오:**
   * `/?token=xxx` 파라미터로 마스터 세션을 획득한 후 `/api/health/status`를 요청하여 실제 URL이 파란색 링크로 잘 열리는지 확인.
   * 신규 대상을 등록하고 삭제했을 때 DB의 데이터 상태가 즉각 연동 갱신되는지 확인.
