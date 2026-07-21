# watchdog-hq: 현재 현황 및 남은 작업 로드맵

> 작성일: 2026-07-21 | 버전: v1.0-SaaS | 브랜치: `main`

---

## 1. 현재 완료된 기능 현황

### ✅ 1.1 인프라 및 데이터베이스

| 항목 | 상태 | 비고 |
|------|------|------|
| SQLite 로컬 개발 DB 연동 | ✅ 완료 | `watchdog.db` 자동 생성 및 스키마 초기화 |
| PostgreSQL 운영 DB 연동 | ✅ 완료 | Neon Cloud Serverless PostgreSQL |
| 이중 DB 자동 전환 (Dual DB) | ✅ 완료 | `DATABASE_TYPE` 환경변수로 제어 |
| DB 스키마 자동 마이그레이션 | ✅ 완료 | `initSqliteTables()` 자동 실행 |

---

### ✅ 1.2 인증 시스템 (Authentication)

| 항목 | 상태 | 비고 |
|------|------|------|
| 이메일 / 비밀번호 회원가입 | ✅ 완료 | bcryptjs 해시 저장 |
| 이메일 / 비밀번호 로그인 | ✅ 완료 | NextAuth CredentialsProvider |
| Google 소셜 로그인 (OAuth) | ✅ 완료 | 클라이언트 키 환경변수 설정 필요 |
| GitHub 소셜 로그인 (OAuth) | ✅ 완료 | 클라이언트 키 환경변수 설정 필요 |
| JWT 세션 관리 | ✅ 완료 | NextAuth JWT 방식 |
| 로그아웃 | ✅ 완료 | `signOut()` 연동 |

---

### ✅ 1.3 프론트엔드 UI 페이지

| 항목 | 상태 | 비고 |
|------|------|------|
| 랜딩 페이지 (비로그인 방문자용) | ✅ 완료 | LandingHero.tsx — 히어로, 기능 소개, 요금제 테이블 |
| 로그인 페이지 | ✅ 완료 | /login — 소셜 버튼 + 이메일 폼 |
| 회원가입 페이지 | ✅ 완료 | /register — 이름, 이메일, 비밀번호 |
| 관제 대시보드 (로그인 후) | ✅ 완료 | 조건부 렌더링 — 로그인 시 자동 전환 |
| 라이트 / 다크 테마 토글 | ✅ 완료 | ThemeToggle.tsx — 브라우저 기억 |

---

### ✅ 1.4 핵심 모니터링 기능

| 항목 | 상태 | 비고 |
|------|------|------|
| API 헬스체크 타겟 등록 | ✅ 완료 | 이름, URL, 주기, 타임아웃 설정 |
| API 헬스체크 타겟 삭제 | ✅ 완료 | 로그인 사용자 본인 타겟만 삭제 가능 |
| 실시간 5초 폴링 상태 조회 | ✅ 완료 | ONLINE / OFFLINE / PENDING |
| 최근 10회 점검 이력 도트 | ✅ 완료 | 성공(초록) / 실패(빨강) LED 도트 |
| 실시간 응답 속도(ms) 표시 | ✅ 완료 | 최신 데이터 수신 시 숫자 플래시 애니메이션 |
| 응답 코드 표시 | ✅ 완료 | HTTP 상태코드 또는 연결 오류 |
| 장애 시 오류 메시지 표시 | ✅ 완료 | 카드 하단 빨간 박스 |

---

### ✅ 1.5 서버 자원 모니터링

| 항목 | 상태 | 비고 |
|------|------|------|
| 에이전트 메트릭 수집 (Go) | ✅ 완료 | server.exe + agent.exe (포트 9090) |
| 서버 자원 모니터링 탭 UI | ✅ 완료 | AgentMonitorTab.tsx — 원형 게이지, 디스크 바 |
| CPU 사용률 게이지 | ✅ 완료 | SVG 원형, 75%↑ 주황 / 90%↑ 빨강 경고 |
| 메모리 사용률 게이지 | ✅ 완료 | 총량/사용량 GB 표시 포함 |
| 디스크 사용량 바 그래프 | ✅ 완료 | 볼륨별 경로, 용량 수치 표시 |
| /api/agents/status 프록시 | ✅ 완료 | Go 서버 응답을 인증 후 Next.js에서 중계 |

---

### ✅ 1.6 알림 시스템

| 항목 | 상태 | 비고 |
|------|------|------|
| Slack 웹훅 알림 전송 | ✅ 완료 | 장애/복구 전환 시 자동 발송 |
| Discord 웹훅 알림 전송 | ✅ 완료 | 장애/복구 전환 시 자동 발송 |
| 카카오 알림톡 (Solapi) 연동 코드 | ✅ 완료 | API 코드 완성 — 키 설정 필요 |
| 알림 채널 등록 모달 UI | ✅ 완료 | AlertSettingsModal.tsx |
| 알림 채널 삭제 | ✅ 완료 | 모달 내 삭제 버튼 |
| 알림 채널 테스트 발송 | ✅ 완료 | /api/alerts/test 엔드포인트 |
| 상태 전이 감지 (ONLINE ↔ OFFLINE) | ✅ 완료 | In-memory 캐시 기반 전이 감지 |

---

### ✅ 1.7 Go 분산 수집기 (Checker)

| 항목 | 상태 | 비고 |
|------|------|------|
| Go 헬스체크 수집기 (checker.exe) | ✅ 완료 | 중앙 API에서 타겟 동기화 후 측정 |
| 수집 결과 벌크 리포트 | ✅ 완료 | POST /api/checker/report 연동 |
| 수집기 인증 토큰 검증 | ✅ 완료 | X-Checker-Token 헤더 검증 |

---

## 2. 남은 작업 목록

### 🔴 P1 — 최우선 (서비스 핵심 기능)

#### 2.1 플랜 요금제 적용 및 한도 제어

현황: 랜딩 페이지에 Free / Starter / Professional 요금제가 표시되지만, 실제 타겟 등록 시 플랜별 한도가 부분적으로만 적용됨.

남은 작업:

- [ ] 플랜별 헬스체크 주기 한도 강제 적용
  - Free: 최소 5분(300초) 이상만 허용
  - Starter: 최소 1분(60초) 이상
  - Professional: 최소 30초 이상
  - 현재: 주기 입력값 제한 없이 등록 가능
- [ ] 플랜별 타겟 등록 개수 DB 조회 정확도 개선
  - COUNT(*) 쿼리에 is_active = 1 조건 추가 (삭제된 타겟 제외)
- [ ] 구독 플랜 변경 이력 관리
  - subscriptions 테이블 활용 (현재 미사용)

---

#### 2.2 결제 시스템 연동

현황: 요금제 테이블은 UI에만 존재하고 실제 결제 처리는 없음.

남은 작업:

- [ ] 결제 수단 선택 결정
  - 국내 서비스: 토스페이먼츠 또는 아임포트(포트원) 권장
  - 글로벌 대상: Stripe 권장
- [ ] 결제 성공 후 플랜 자동 업그레이드 처리 (Webhook 수신 → users.plan_tier 갱신)
- [ ] 결제 내역 조회 페이지 (/settings/billing)
- [ ] 구독 해지 처리

---

#### 2.3 사용자 마이페이지 (/settings)

현황: 별도 설정 페이지 없음. 로그아웃만 가능.

남은 작업:

- [ ] 마이페이지 라우트 생성 (/settings 또는 /profile)
- [ ] 프로필 수정 — 이름, 이메일 변경
- [ ] 비밀번호 변경 (이메일 가입 사용자 한정)
- [ ] 현재 플랜 확인 및 업그레이드 버튼
- [ ] 회원 탈퇴 처리 — DB 데이터 소프트 삭제

---

### 🟠 P2 — 중요 (운영 품질 향상)

#### 2.4 알림 이력 조회

현황: 알림 발송 후 이력이 기록되지 않음.

남은 작업:

- [ ] alert_logs 테이블 추가 (SQLite + PostgreSQL)
  - 컬럼: id, target_id, channel_type, destination, is_success, sent_at
- [ ] 알림 발송 시 로그 기록 (notifier.ts의 dispatchAlerts 내 처리)
- [ ] 알림 이력 조회 UI — 대시보드 탭 또는 별도 섹션

---

#### 2.5 업타임 통계 리포트

현황: 최근 10회 이력 도트만 표시, 장기 통계 없음.

남은 작업:

- [ ] 일별/주별 가용률(%) 계산 API (/api/health/stats)
- [ ] 통계 그래프 UI 컴포넌트 (7일간 일별 가용률 막대, 응답속도 라인)
- [ ] 공개 상태 페이지 (Public Status Page) — 선택 기능

---

#### 2.6 카카오 알림톡 실제 운영 연동

현황: 코드는 완성되었으나 실제 발송을 위한 API 키가 미설정.

남은 작업:

- [ ] Solapi 계정 가입 및 발신번호 등록
- [ ] 카카오 비즈니스 채널 연동 및 PFID 발급
- [ ] 알림톡 메시지 템플릿 등록 (카카오 비즈니스 심사 필요)
- [ ] .env.local 실제 키 값 입력 (SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_PHONE, SOLAPI_ALIMTALK_PFID)

---

#### 2.7 관리자 전용 대시보드 (/admin)

현황: 관리자 토큰으로 접속 시 모든 타겟이 보이지만, 전용 관리 UI 없음.

남은 작업:

- [ ] 관리자 전용 라우트 (/admin)
  - 전체 회원 목록 조회
  - 회원별 타겟 등록 현황
  - 플랜별 사용 통계
- [ ] 관리자 계정 지정 방식 결정
  - 옵션 A: 환경변수로 특정 이메일을 Admin 지정
  - 옵션 B: DB users 테이블에 role 컬럼 추가

---

### 🟡 P3 — 개선 (사용성 향상)

#### 2.8 헬스체크 등록 모달 고급 옵션

현황: 기본 필드(이름, URL, 주기, 타임아웃)만 존재.

남은 작업:

- [ ] HTTP 메서드 선택 (GET / POST / HEAD)
- [ ] 기대 응답 코드 설정 (기본값: 200)
- [ ] 커스텀 요청 헤더 추가
- [ ] 타겟 활성/비활성 토글 (삭제 없이 일시 중지)
- [ ] 등록 후 즉시 1회 테스트 체크 버튼

---

#### 2.9 알림 채널 확장

현황: Slack, Discord, 카카오 3종만 지원.

남은 작업:

- [ ] 이메일 알림 지원 (SendGrid / AWS SES 연동)
- [ ] Teams 웹훅 지원 (Microsoft Teams)
- [ ] 알림 조건 세분화 (N분 지속 장애 시 알림, 야간 제외 시간대 설정)

---

#### 2.10 소셜 OAuth 실제 키 설정

현황: GitHub/Google OAuth 코드는 완성, 실제 앱 등록 및 키 미입력.

남은 작업:

- [ ] GitHub OAuth App 등록 → GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET 입력
- [ ] Google OAuth Client 등록 → GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 입력
- 상세 절차: docs/08_oauth_setup_guide.md 참조

---

### 🔵 P4 — 운영 배포 (Production 준비)

#### 2.11 운영 환경 배포

현황: 로컬 개발 환경에서만 동작 확인.

남은 작업:

- [ ] Next.js 포털 배포 (추천: Vercel)
  - DATABASE_TYPE=postgres 설정, Neon DB 연결 확인
- [ ] Go 수집기(checker.exe) 외부 서버 배포
  - config.json의 portal_url을 실제 도메인으로 변경
- [ ] Go 모니터링 서버(server.exe) 외부 접근 허용
- [ ] 운영 환경변수 재설정
  - NEXTAUTH_URL = 실제 도메인
  - NEXTAUTH_SECRET = 강력한 랜덤 키로 교체
- [ ] HTTPS / 도메인 연결 (Vercel 자동 SSL 또는 Let's Encrypt)

---

#### 2.12 데이터 관리 및 유지보수

현황: health_logs가 무제한으로 쌓임, 정리 정책 없음.

남은 작업:

- [ ] 로그 보존 기간 정책 적용
  - Free: 7일 / Starter: 30일 / Professional: 90일
  - 주기적 오래된 로그 삭제 Cron Job
- [ ] DB 백업 자동화 (PostgreSQL 운영 시)
- [ ] health_logs(target_id, timestamp) 복합 인덱스 추가

---

## 3. 요약 — 우선순위 체크리스트

```
🔴 P1 (핵심)
  [ ] 1. 플랜별 헬스체크 주기 한도 강제 적용
  [ ] 2. 결제 시스템 연동 (토스페이먼츠 / Stripe)
  [ ] 3. 마이페이지 (/settings) 구현

🟠 P2 (중요)
  [ ] 4. 알림 이력 조회 기능 (alert_logs 테이블 + UI)
  [ ] 5. 업타임 통계 그래프 (7일 가용률)
  [ ] 6. 카카오 알림톡 운영 키 설정 (Solapi)
  [ ] 7. 관리자 대시보드 (/admin)

🟡 P3 (개선)
  [ ] 8. 헬스체크 등록 모달 고급 옵션 추가
  [ ] 9. 이메일 알림 채널 지원
  [ ] 10. GitHub / Google OAuth 실제 키 입력

🔵 P4 (배포)
  [ ] 11. Vercel 또는 자체 서버 운영 배포
  [ ] 12. 로그 보존 기간 정책 및 Cron 정리
```

---

## 4. 현재 아키텍처 요약

```
[브라우저]
    │
    ▼
[watchdog-hq / Next.js 포털 :3088]
    ├── /            랜딩 페이지 (비로그인) or 관제 대시보드 (로그인)
    ├── /login       이메일 + 소셜 로그인
    ├── /register    회원가입
    ├── /api/auth    NextAuth 세션 관리
    ├── /api/health  헬스체크 타겟 및 상태 조회
    ├── /api/checker 수집기 타겟 동기화 및 리포트 수신
    ├── /api/alerts  알림 채널 관리 및 테스트 발송
    └── /api/agents  Go 서버 메트릭 프록시
            │
            ├── [SQLite :watchdog.db]    ← 개발 환경
            └── [PostgreSQL :Neon Cloud] ← 운영 환경

[go-watchdog / checker.exe - 백그라운드]
    └── watchdog-hq API에서 타겟 동기화 → 주기 측정 → 결과 리포트

[go-watchdog / server.exe :9090]
    └── agent.exe로부터 CPU/메모리/디스크 메트릭 수집 및 저장
```

---

*문서 위치: docs/09_remaining_tasks.md | 최종 수정: 2026-07-21*
