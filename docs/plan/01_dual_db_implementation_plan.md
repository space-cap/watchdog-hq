# [구현 계획서] 개발 환경 SQLite & 운영 환경 PostgreSQL 이중 데이터베이스(Dual DB) 구축

Neon Cloud PostgreSQL 무료 플랜의 일일 쿼리 한도(Rate Limit) 초과 문제를 해결하기 위해, **로컬 개발 환경에서는 고성능 로컬 파일 DB인 SQLite (`watchdog.db`)를 사용**하고 **운영 환경에서는 상용 PostgreSQL**을 사용하는 이중 데이터베이스 아키텍처(DataStore 패턴)를 구축합니다.

---

## 1. 개요 및 목적

* **문제 상황:** Neon Cloud PostgreSQL 무료 플랜 이용 시 5초 주기 헬스체크 리포트 수집으로 인해 일일 커넥션 및 쿼리 요청 제한(Rate Limit)이 빠르게 초과되는 현상 발생.
* **해결 방안:** 로컬 개발 환경(`NODE_ENV=development` 또는 `DATABASE_TYPE=sqlite`)에서는 Zero Network Latency를 자랑하는 로컬 파일 기반 DB인 SQLite3 (`watchdog.db`)를 자동 채택하고, 상용 배포 운영 환경(`NODE_ENV=production` 또는 `DATABASE_TYPE=postgres`)에서는 PostgreSQL을 사용하도록 이중 드라이버(DataStore) 구조 구축.

---

## 2. 주요 변경 사항 (Proposed Changes)

### 2.1 패키지 및 환경 설정 (Dependencies & Config)
* `package.json`: `better-sqlite3` 및 `@types/better-sqlite3` 패키지 추가.
* `.env.example`: `DATABASE_TYPE=sqlite` 가이드 설정 명시.

### 2.2 코어 데이터 레이어 (Core Data Access Layer)
* `src/lib/db.ts`:
  * `better-sqlite3` 연동 및 `watchdog.db` 로컬 파일 스토리지 자동 생성.
  * 테이블 자동 스키마 초기화 (`initSqliteTables()`):
    * `users` (id, email, password, name, plan_tier, created_at)
    * `health_targets` (id, user_id, name, url, interval_seconds, timeout_seconds, is_active, created_at)
    * `health_logs` (id, target_id, status_code, latency_ms, is_success, error_message, timestamp)
    * `alert_channels` (id, user_id, channel_type, webhook_url, is_active, created_at)
  * SQL 파라미터 변환 지원 (`$1, $2...` -> `?` 자동 변환) 및 `queryDB<T>` 공통 헬퍼 강화.

### 2.3 API 엔드포인트 호환성 검증
* `src/app/api/health/targets/route.ts`: SQLite / PG 호환 `queryDB` 적용.
* `src/app/api/health/status/route.ts`: SQLite / PG 호환 `queryDB` 적용.
* `src/app/api/checker/report/route.ts`: 고속 리포트 수집 시 SQLite 배치 처리 및 트랜잭션 호환 적용.

---

## 3. 검증 및 테스트 계획 (Verification Plan)

1. **자동화 빌드 검증:** `npm run build` 실행으로 TypeScript 타입 검사 및 컴파일 통과 확인.
2. **로컬 SQLite DB 생성 검증:** 프로젝트 루트에 `watchdog.db` 생성 및 4개 테이블 스키마 자동 구축 확인.
3. **타겟 등록 & 관제 테스트:** 대시보드에서 타겟 등록 시 SQLite 기록 및 `watchdog-checker.exe` 수집기 정상 연동 검증.
4. **회원가입 & 로그인 테스트:** 이메일 회원가입 및 세션 관리가 SQLite 기반으로 무제한 자유롭게 동작하는지 검증.
