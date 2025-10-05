# 컴포넌트 (components/)

재사용 가능한 React 컴포넌트들의 모음입니다.

## 개요

이 디렉토리에는 애플리케이션의 UI를 구성하는 모든 React 컴포넌트가 포함되어 있습니다. 컴포넌트는 기능과 목적에 따라 하위 디렉토리로 분류되어 있으며, 재사용성과 유지보수성을 고려한 구조로 설계되었습니다.

## 디렉토리 구조

```
components/
├── ui/                 # 기본 UI 컴포넌트 라이브러리
│   └── button.tsx     # 버튼 컴포넌트
└── line-chart.tsx     # 시장 데이터 시각화 차트 컴포넌트
```

## 컴포넌트 분류

### 1. 기본 UI 컴포넌트 (`ui/`)

기본적인 사용자 인터페이스 요소들을 제공하는 컴포넌트들입니다. 디자인 시스템의 기반이 되며, 일관된 스타일과 동작을 보장합니다.

#### Button 컴포넌트 (`ui/button.tsx`)

다양한 스타일 변형을 지원하는 버튼 컴포넌트입니다.

**특징:**

- **다양한 변형**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **크기 옵션**: `sm`, `default`, `lg`, `icon`
- **접근성**: 키보드 네비게이션, 스크린 리더 지원
- **커스터마이징**: `className`을 통한 추가 스타일 적용

**사용법:**

```tsx
import { Button } from "@/components/ui/button";

// 기본 버튼
<Button>클릭하세요</Button>

// 변형 버튼들
<Button variant="outline">외곽선</Button>
<Button variant="destructive">위험</Button>
<Button size="sm">작은 버튼</Button>
<Button size="icon">
  <IconComponent />
</Button>
```

**Props:**

- `variant?`: 버튼 스타일 변형
- `size?`: 버튼 크기
- `asChild?`: 다른 컴포넌트로 렌더링
- 기타 HTML button 요소의 모든 속성

### 2. 비즈니스 컴포넌트

특정 비즈니스 로직이나 도메인 기능을 구현한 컴포넌트들입니다.

#### LineChart 컴포넌트 (`line-chart.tsx`)

시장 데이터의 시계열 시각화를 위한 차트 컴포넌트입니다.

**특징:**

- **다중 시계열**: 여러 데이터 시리즈 동시 표시
- **반응형**: 다양한 화면 크기 대응
- **커스터마이징**: 색상, 높이, 선 두께 조절
- **Recharts 기반**: 검증된 차트 라이브러리 사용

**사용법:**

```tsx
import LineChart from "@/components/line-chart";

const series = [
  { name: "SPY", data: spyData },
  { name: "SMA(20)", data: smaData, color: "#ef4444" },
];

<LineChart series={series} height={300} strokeWidth={2} />;
```

**Props:**

- `series`: 표시할 데이터 시리즈 배열
- `height?`: 차트 높이 (기본값: 240)
- `strokeWidth?`: 선 두께 (기본값: 1.5)

## 개발 가이드라인

### 컴포넌트 설계 원칙

1. **단일 책임**: 각 컴포넌트는 하나의 주요 기능을 담당
2. **재사용성**: 다양한 상황에서 재사용 가능하도록 설계
3. **합성성**: 작은 컴포넌트들을 조합하여 복잡한 UI 구성
4. **타입 안전성**: TypeScript를 통한 타입 정의 필수

### 스타일링 전략

- **Tailwind CSS**: 유틸리티 기반 스타일링 사용
- **CSS 변수**: 전역 색상 및 디자인 토큰 활용
- **반응형 디자인**: 모바일 우선 접근법
- **다크 모드**: CSS 변수 기반 테마 전환 지원

### 접근성 (Accessibility)

- **ARIA 속성**: 적절한 ARIA 라벨 및 설명 사용
- **키보드 네비게이션**: 모든 인터랙션 요소에 키보드 접근성 보장
- **스크린 리더**: 시각적 정보뿐만 아니라 보조 기술을 위한 정보 제공
- **색상 대비**: WCAG 가이드라인 준수

### 성능 최적화

- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 비용이 높은 연산 최적화
- **코드 분할**: 컴포넌트 단위의 지연 로딩 고려

## 컴포넌트 추가 방법

새로운 컴포넌트를 추가할 때는 다음 단계를 따르세요:

1. **디렉토리 구조 결정**: `ui/` 또는 적절한 하위 디렉토리 선택
2. **컴포넌트 구현**: TypeScript와 접근성 고려
3. **Props 인터페이스 정의**: 명확하고 타입 안전한 API 설계
4. **스타일링**: Tailwind CSS와 기존 디자인 시스템 준수
5. **내보내기**: `index.ts` 파일에 컴포넌트 추가
6. **문서화**: 사용법과 예제 포함

## 테스트 전략

컴포넌트 테스트는 다음과 같은 접근법을 권장합니다:

- **단위 테스트**: 개별 컴포넌트의 로직 테스트
- **통합 테스트**: 컴포넌트 간 상호작용 테스트
- **시각적 회귀 테스트**: UI 변경사항 검증
- **접근성 테스트**: 스크린 리더 및 키보드 네비게이션 테스트

## 추가 리소스

- [React 컴포넌트 설계](https://react.dev/learn/your-first-component)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Radix UI 문서](https://www.radix-ui.com/)
- [Recharts 문서](https://recharts.org/en-US/)
