# [디자인 시스템 가이드라인] watchdog-hq: 프리미엄 디자인 시스템 및 비주얼 가이드라인

본 문서는 AI가 양산하는 흔하고 평범한 템플릿 디자인을 배제하고, 실제 상용 웹 서비스(SaaS)로서 사용자에게 시각적 놀라움(Wow-factor)과 신뢰감을 주는 **독보적인 미래형 다크 모드 및 글래스모피즘(Glassmorphism)** UI/UX 디자인 시스템 명세서입니다.

---

## 1. 비주얼 컨셉 및 디자인 원칙

1. **Aurora & Cyberpunk Glassmorphic 테마:**
   * 깊고 어두운 우주색(우주 네이비/차콜) 배경 위에 미려한 반투명 유리 질감의 프레임과 네온 컬러의 오로라 글로우(Glow) 효과를 조화롭게 융합합니다.
2. **반응성 및 생동감 (Alive UI):**
   * 모든 인터랙티브 요소는 마우스 호버 및 포커스 시 부드러운 가감속 애니메이션(`cubic-bezier`)과 미세한 빛 퍼짐 효과를 주어 화면이 살아 움직이는 듯한 느낌을 전달합니다.
3. **타이포그래피의 세련미:**
   * 브라우저 기본 폰트를 배제하고, 세련되고 현대적인 기하학적 형태의 **Outfit** 폰트(제목용)와 초고해상도 모니터링 가독성에 최적화된 **Inter** 폰트(본문/데이터용)를 연동합니다.

---

## 2. 디자인 토큰 및 컬러 팔레트 (Tailwind CSS Tokens)

Tailwind CSS 테마 설정에 매핑하여 적용할 엄선된 HSL 조화 컬러 토큰입니다.

| 의미 | 토큰명 | HSL / HEX 값 | 사용 목적 및 시각적 예시 |
| :--- | :--- | :--- | :--- |
| **Deep Base** | `background` | `hsl(224, 71%, 4%)` / `#02040A` | 전체 레이아웃의 가장 깊고 어두운 백그라운드 색상 |
| **Card Base** | `card` | `rgba(255, 255, 255, 0.03)` | 글래스모피즘이 적용되는 반투명 카드 및 컨테이너 배경 |
| **Border Accent**| `border` | `rgba(255, 255, 255, 0.07)` | 카드의 유리 질감을 표현하는 얇고 투명한 테두리 |
| **Primary Glow** | `primary` | `linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)` | 메인 강조 아이콘, 그라디언트 테두리, 주요 버튼 컬러 |
| **Online Glow** | `success` | `#10B981` (Glow: `rgba(16, 185, 129, 0.45)`) | 실시간 정상 구동 상태 (네온 에메랄드 그린 글로우) |
| **Offline Glow**| `destructive`| `#FF2E93` (Glow: `rgba(255, 46, 147, 0.5)`) | 장애 상태 경고 (네온 사이버펑크 핑크-레드 글로우) |
| **Text Primary** | `foreground` | `hsl(210, 40%, 98%)` / `#F8FAFC` | 제목 및 중요한 수치 데이터 텍스트 |
| **Text Muted** | `muted` | `hsl(215, 20%, 65%)` / `#94A3B8` | 상세 라벨 및 보조 설명 텍스트 |

---

## 3. 글래스모피즘 (Glassmorphism) 세부 구현 표준

AI 특유의 탁하고 어색한 불투명 효과를 없애기 위한 정밀 유리 질감 CSS 명세입니다.

```css
/* 프리미엄 글래스모피즘 카드 표준 CSS */
.premium-glass-card {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 
        0 4px 30px rgba(0, 0, 0, 0.4),
        inset 0 1px 1px rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 카드 호버 시 그라디언트 하이라이트 및 네온 쉐도우 효과 */
.premium-glass-card:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 242, 254, 0.3);
    box-shadow: 
        0 10px 40px rgba(0, 0, 0, 0.6),
        0 0 20px rgba(0, 242, 254, 0.15),
        inset 0 1px 2px rgba(255, 255, 255, 0.1);
}
```

---

## 4. 데이터 시각화 및 인터랙티브 마이크로 애니메이션

전문적인 가용성 차트 및 상태 피드백을 전달하기 위한 동적 스펙입니다.

### 4.1 상태 배지(Status Badge) 펄스(Pulse) 애니메이션
온라인/오프라인 상태를 표시하는 작은 원형 배지에는 단순 깜빡임이 아닌 부드러운 파동 애니메이션을 탑재합니다.
```css
.pulse-glow-success {
    position: relative;
}
.pulse-glow-success::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--success);
    border-radius: 50%;
    animation: ripple 2s infinite ease-out;
}
@keyframes ripple {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(3); opacity: 0; }
}
```

### 4.2 LED 히스토리 도트 렌더링
* **이전 상태 도트:** 단순히 단색 동그라미로 배치하지 않고, 각 상태별로 미세한 내부 섀도우(Inner Shadow)를 주어 입체감을 강조하고, 호버 시 해당 점검 시각과 latency가 툴팁으로 우아하게 뜨도록 구현합니다.

### 4.3 차트 컴포넌트 설계 (`Tremor UI` 표준)
* 응답 지연 속도 차트는 면적 차트(Area Chart)를 사용하되, 선 아래의 칠해지는 영역에 **부드러운 세로 그라디언트 페이드아웃(Gradient Fade-out)** 효과를 줍니다.
* 차트 그리드 라인은 극도로 투명하게(`stroke: rgba(255, 255, 255, 0.03)`) 처리하여 데이터 라인이 돋보이도록 설계합니다.

---

## 5. UI Layout 구조 기획 (콘솔 화면 구성 요건)

* **배경 레이아웃:** 화면 상단 모서리와 우측 하단 모서리에 거대한 원형 블러 데코레이션(Radial Gradient Blur Oozes, `#4FACFE` 및 `#FF2E93` 색상, `filter: blur(150px)`)을 깔아 은은한 네온 조명을 선사합니다.
* **사이드바 / 네비게이션:** 투명한 유리 바에 글로우 테두리가 들어간 형태이며, 현재 활성화된 탭은 그라디언트 언더라인 애니메이션이 따라붙게 처리합니다.
* **등록 모달:** 화면 정중앙에서 갑자기 툭 튀어나오는 AI 스타일을 배제하고, 우측 사이드에서 부드럽게 미끄러져 나오는 **드로워(Drawer)** 또는 부드러운 스케일 업 애니메이션을 사용하여 모달의 고급감을 살립니다.
