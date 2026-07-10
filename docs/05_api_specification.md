# [API 명세서] watchdog-hq: API 연동 명세서

본 문서는 `watchdog-hq` 중앙 제어 서버(Next.js Web Server)와 분산 가동되는 수집 노드 `watchdog-server`(Go Checker) 간의 통신 규약 및 대시보드 데이터 조회용 REST API 연동 명세서입니다.

---

## 1. 공통 통신 규칙 및 보안 인증 (Security)

1. **프로토콜:** 모든 API 요청은 보안 통신인 **`HTTPS`**를 강제합니다.
2. **인증 헤더:** 분산 Go Checker와 중앙 API 간의 모든 통신은 요청 헤더에 마스터 토큰(`auth_token`) 검증 헤더를 필수로 포함해야 합니다. 인증되지 않은 요청은 즉시 `401 Unauthorized`로 거절됩니다.
   * **인증 헤더 Key:** `X-Checker-Token`
   * **인증 헤더 Value:** `watchdog-secret-token` (설정에 정의된 값)
3. **데이터 포맷:** 모든 요청 Body 및 응답 Body는 **`application/json`** 포맷을 준수합니다.

---

## 2. Checker 노드 연동 API (Checker ↔ Central Server)

### 2.1 [GET] 감시 대상 동기화 API
Go Checker 노드가 주기적으로 호출하여 자신이 모니터링해야 하는 활성 헬스체크 타겟 리스트를 동적으로 가져오는 API입니다.

* **엔드포인트:** `/api/checker/targets`
* **HTTP 메소드:** `GET`
* **요청 헤더:**
  ```http
  X-Checker-Token: watchdog-secret-token
  ```
* **요청 파라미터:** 없음
* **응답 바디 (JSON Array):**
  ```json
  [
    {
      "id": 1024,
      "name": "Local Front (Vite)",
      "url": "http://localhost:5173/api/health",
      "interval_seconds": 5,
      "timeout_seconds": 2
    },
    {
      "id": 1025,
      "name": "Oracle DB Server",
      "url": "http://140.245.64.172:1521",
      "interval_seconds": 60,
      "timeout_seconds": 5
    }
  ]
  ```

---

### 2.2 [POST] 가용성 결과 벌크 보고 API
Go Checker 노드가 각 타겟별 헬스체크 측정을 마친 뒤, 결과 데이터를 중앙 서버로 한 번에 전송(벌크 전송)하여 DB에 적재하는 API입니다.

* **엔드포인트:** `/api/checker/report`
* **HTTP 메소드:** `POST`
* **요청 헤더:**
  ```http
  Content-Type: application/json
  X-Checker-Token: watchdog-secret-token
  ```
* **요청 바디 (JSON Array):**
  ```json
  [
    {
      "target_id": 1024,
      "status_code": 200,
      "latency_ms": 12,
      "is_success": true,
      "error_message": "",
      "timestamp": "2026-07-10T20:30:00Z"
    },
    {
      "target_id": 1025,
      "status_code": 0,
      "latency_ms": 5000,
      "is_success": false,
      "error_message": "Get \"http://...\": dial tcp: connection timeout",
      "timestamp": "2026-07-10T20:30:05Z"
    }
  ]
  ```
* **응답 바디 (JSON):**
  * **HTTP Status:** `200 OK` (성공 시)
  * **Body:**
    ```json
    {
      "status": "success",
      "processed_records": 2,
      "timestamp": "2026-07-10T20:30:08Z"
    }
    ```

---

## 3. 프론트엔드 대시보드 API (Web Console ↔ API Server)

대시보드 웹 화면이 데이터를 동적으로 그리고 어드민 보안 제어를 하기 위해 호출하는 API 명세입니다.

### 3.1 [GET] 실시간 가동 현황판 데이터 조회 API
* **엔드포인트:** `/api/health/status`
* **HTTP 메소드:** `GET`
* **요청 헤더:**
  * 관리자 세션 쿠키가 포함될 수 있습니다 (`session_token`).
* **응답 제어 및 마스킹 (보안 정책):**
  * **관리자 세션 쿠키 존재 시:** 실제 `url` 데이터를 원본 그대로 표출합니다.
  * **일반 방문자(쿠키 부재) 접근 시:** `url` 데이터를 `"Hidden (Admin Only)"`로 치환(마스킹)하여 전달합니다.
* **응답 바디 (JSON Array):**
  ```json
  [
    {
      "id": 1024,
      "name": "Local Front (Vite)",
      "url": "http://localhost:5173/api/health", // 비인가자 접근 시 "Hidden (Admin Only)" 로 자동 치환
      "interval_seconds": 5,
      "status": "ONLINE", // ONLINE, OFFLINE, PENDING
      "last_check": "2026-07-10T20:30:00Z",
      "last_latency_ms": 12,
      "last_status_code": 200,
      "error_message": "",
      "history": [1, 1, 1, 0, 1, 1, 1, 1, 1, 1] -- 최신 10회 가동 이력 (1: 성공, 0: 실패)
    }
  ]
  ```

---

## 4. 예외 및 에러 응답 규격

모든 에러 상황 시 중앙 API는 표준화된 JSON 형식으로 에러 코드를 전송하여 에이전트 및 프론트엔드의 예외 처리를 돕습니다.

* **에러 응답 바디 (JSON):**
  ```json
  {
    "error": "Unauthorized",
    "message": "Invalid or missing X-Checker-Token header",
    "timestamp": "2026-07-10T20:30:08Z"
  }
  ```
* **대표 에러 코드 정의:**
  * `400 Bad Request`: JSON 바디 파싱 실패 또는 필수 인자 누락.
  * `401 Unauthorized`: `X-Checker-Token` 불일치 또는 관리자 세션 만료.
  * `405 Method Not Allowed`: 정의되지 않은 HTTP 메소드로 진입 시도.
  * `500 Internal Server Error`: 데이터베이스 쓰기 오류 또는 서버 내부 런타임 결함.
