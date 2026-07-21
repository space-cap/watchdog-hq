# [구현 계획서] watchdog-hq: 통합 구현 계획서

본 문서는 상용 SaaS 가용성 모니터링 서비스 `watchdog-hq`의 웹 포털(Next.js) 구축, 분산 측정 엔진 `watchdog-checker` 신설, 통합 인증 시스템 및 카카오 알림톡/슬랙 실시간 장애 알림 워커를 아우르는 최종 통합 구현 계획서입니다.

---

## 1. 개요 및 구현 범위

* **웹 포털 (watchdog-hq):**
  * **회원 인증:** 구글/깃허브 소셜 OAuth 및 이메일/비밀번호 가입/로그인 지원 (NextAuth + bcryptjs).
  * **실시간 알림 워커:** 가용성 상태 전이(`ONLINE ↔ OFFLINE`) 발생 시 카카오 알림톡/SMS (Solapi API) 및 슬랙/디스코드 웹훅 즉시 트리거.
  * **관제 대시보드:** Neon Serverless PostgreSQL DB 연동, 권한 기반 URL 마스킹 및 실시간 5초 폴링 Uptime 카드 제공.
* **측정 노드 (go-watchdog/checker/ [신설]):** 
  * 기존 단독 설치형 서버(`go-watchdog/server`)의 소스 코드는 **훼손 없이 원본 그대로 보존**합니다.
  * 대신, SaaS 전용으로 작동할 초경량 **`checker` 모듈**을 별도의 독립 폴더(`go-watchdog/checker/`)에 신규 개발하여 분산 수집기로 활용합니다.

---

## 2. 생성 및 수정 파일 목록 (Proposed File Changes)

### 2.1 [Go Checker] 독립 수집기 신설 (`h:/lee/go-watchdog/`)
* **[NEW] [checker/main.go](file:///h:/lee/go-watchdog/checker/main.go):**
  * `config.json`의 중앙 포털 URL 및 보안 토큰을 읽어 `targets`를 동기화하고 측정을 시작하는 Checker 데몬 진입점.
* **[NEW] [checker/runner.go](file:///h:/lee/go-watchdog/checker/runner.go):**
  * 중앙 API(`GET /api/checker/targets`)로 타겟을 주기적으로 Fetch하고 가용성 측정 후 결과를 중앙 API(`POST /api/checker/report`)로 비동기 벌크 리포트하는 스케줄링 러너 엔진.
* **[NEW] [checker/config.json](file:///h:/lee/go-watchdog/checker/config.json):**
  * Checker 노드 전용 로컬 설정 파일 (중앙 웹 서버 URL 및 `X-Checker-Token` 설정값 보관).

### 2.2 [Next.js 웹 포털] 데이터 & 인증 레이어 (`h:/lee/watchdog-hq/`)
* **[NEW] [src/lib/db.ts](file:///h:/lee/watchdog-hq/src/lib/db.ts):**
  * Neon PostgreSQL 클라우드 DB 연결 풀(Connection Pool, SSL 연동) 및 헬퍼 모듈.
* **[NEW] [scripts/init.sql](file:///h:/lee/watchdog-hq/scripts/init.sql) & [scripts/migrate_auth.mjs](file:///h:/lee/watchdog-hq/scripts/migrate_auth.mjs):**
  * users(password_hash 포함), subscriptions, health_targets, alert_channels, health_logs 및 당월 파티션 DDL 스크립트.
* **[NEW] [src/lib/auth.ts](file:///h:/lee/watchdog-hq/src/lib/auth.ts):**
  * NextAuth 설정 모듈 (CredentialsProvider + GoogleProvider + GitHubProvider, JWT 세션 연동).
* **[NEW] [src/lib/notifier.ts](file:///h:/lee/watchdog-hq/src/lib/notifier.ts):**
  * 슬랙/디스코드 웹훅 전송 및 솔라피(Solapi API) 카카오 알림톡/SMS 메시징 전송 헬퍼 모듈.

### 2.3 [Next.js 웹 포털] 백엔드 API 레이어 (`h:/lee/watchdog-hq/src/app/api/`)
* **[NEW] [route.ts (auth)](file:///h:/lee/watchdog-hq/src/app/api/auth/[...nextauth]/route.ts):** NextAuth API 핸들러.
* **[NEW] [route.ts (register)](file:///h:/lee/watchdog-hq/src/app/api/auth/register/route.ts):** 이메일/비밀번호 회원가입 API.
* **[NEW] [route.ts (checker-targets)](file:///h:/lee/watchdog-hq/src/app/api/checker/targets/route.ts):** Checker용 타겟 동기화 API.
* **[NEW] [route.ts (checker-report)](file:///h:/lee/watchdog-hq/src/app/api/checker/report/route.ts):** Checker용 가용성 벌크 리포트 수신 & **상태 전이(ONLINE ↔ OFFLINE) 알림 큐 트리거 API**.
* **[NEW] [route.ts (alerts-channels)](file:///h:/lee/watchdog-hq/src/app/api/alerts/channels/route.ts):** 알림 수신처(슬랙/디스코드 웹훅, 카카오 알림톡 번호) CRUD API.
* **[NEW] [route.ts (health-status)](file:///h:/lee/watchdog-hq/src/app/api/health/status/route.ts):** 대시보드용 Uptime 상태 및 마스킹 API.
* **[NEW] [route.ts (health-targets)](file:///h:/lee/watchdog-hq/src/app/api/health/targets/route.ts):** 어드민/회원 타겟 등록/삭제 관리 API.

### 2.4 [Next.js 웹 포털] 프론트엔드 UI & 컴포넌트 레이어 (`h:/lee/watchdog-hq/src/`)
* **[NEW] [src/app/login/page.tsx](file:///h:/lee/watchdog-hq/src/app/login/page.tsx):** 소셜 OAuth 버튼 & 이메일/비번 통합 로그인 페이지.
* **[NEW] [src/app/register/page.tsx](file:///h:/lee/watchdog-hq/src/app/register/page.tsx):** 이메일/비밀번호 회원가입 페이지.
* **[NEW] [src/components/APICard.tsx](file:///h:/lee/watchdog-hq/src/components/APICard.tsx):** 반응형 Uptime 카드, 펄스 배지 & 최근 10회 히스토리 도트.
* **[NEW] [src/components/RegisterModal.tsx](file:///h:/lee/watchdog-hq/src/components/RegisterModal.tsx):** 헬스체크 신규 등록 모달.
* **[NEW] [src/components/AlertSettingsModal.tsx](file:///h:/lee/watchdog-hq/src/components/AlertSettingsModal.tsx):** 알림 채널(슬랙 웹훅, 카카오 알림톡 번호) 설정 모달.
* **[MODIFY] [src/app/page.tsx](file:///h:/lee/watchdog-hq/src/app/page.tsx):** 메인 관제 센터 대시보드 뷰 (NextAuth 프로필 및 알림 설정 모달 바인딩).

---

## 3. 검증 및 테스트 시나리오 (Verification Plan)

1. **Go Checker ↔ Next.js 로컬 통신 및 상태 전이 알림 테스트:**
   * Go Checker가 30초마다 타겟을 동기화하고 측정 결과를 리포트할 때, 장애(`OFFLINE`) 감지 시 `dispatchAlerts()` 함수가 3초 내 비동기 발송되는지 확인.
2. **소셜 OAuth 및 이메일/비밀번호 인증 검증:**
   * `/register` 회원가입 시 Neon DB `users` 테이블에 비밀번호가 bcrypt 해시값으로 인서트되는지 확인.
   * `/login` 페이지에서 로그인 시 NextAuth JWT 세션 쿠키가 정상 발급되는지 확인.
3. **알림 수신처 등록 & 마스킹 보안 확인:**
   * 대시보드 상단 `[🔔 알림 채널 설정]` 버튼을 통해 슬랙 웹훅 및 카카오 알림톡 수신 번호가 등록되는지 확인.
