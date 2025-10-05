# 소스 코드 (src/)

Next.js 애플리케이션의 핵심 소스 코드 디렉토리입니다.

## 개요

이 디렉토리에는 Next.js 15 App Router 기반의 모든 애플리케이션 코드가 포함되어 있습니다. 현대적인 풀스택 웹 애플리케이션의 구조를 따르고 있으며, 컴포넌트 기반 아키텍처를 사용합니다.

## 디렉토리 구조

```
src/
├── app/                 # Next.js App Router (페이지 및 API)
│   ├── api/            # API 라우트 핸들러들
│   ├── globals.css     # 전역 CSS 스타일
│   ├── layout.tsx      # 루트 레이아웃 컴포넌트
│   └── page.tsx        # 홈페이지 컴포넌트
├── components/         # 재사용 가능한 UI 컴포넌트들
│   ├── ui/            # 기본 UI 컴포넌트 라이브러리
│   └── line-chart.tsx # 시장 데이터 차트 컴포넌트
└── lib/               # 유틸리티 함수 및 비즈니스 로직
    ├── indicators.ts  # 기술적 분석 지표 계산 함수들
    ├── mock-data.ts   # 개발용 목업 데이터
    └── utils.ts       # 공통 유틸리티 함수들
```

## 주요 파일 설명

### App Router (`app/`)

#### `layout.tsx`

- 애플리케이션의 루트 레이아웃 정의
- HTML 문서 구조 설정
- 전역 폰트(Geist Sans/Mono) 로드
- 메타데이터 설정

#### `page.tsx`

- 홈페이지 컴포넌트
- 시장 데이터 시각화 메인 페이지
- 두 가지 위험 분석 옵션 제공:
  - **옵션 A**: SPY/TIP 이동평균 모멘텀 기반 분석
  - **옵션 B**: S&P 500 배당수익률 기반 분석

#### `globals.css`

- Tailwind CSS 전역 스타일
- CSS 변수 및 기본 스타일 정의
- 다크 모드 지원

### API 라우트 (`app/api/`)

#### `prices/route.ts`

- 주식 가격 데이터 API 엔드포인트
- 여러 티커의 가격 시계열 데이터 제공
- 쿼리 파라미터: `tickers`, `period`, `interval`

#### `spx-dividend-yield/route.ts`

- S&P 500 배당수익률 데이터 API 엔드포인트
- 배당 데이터를 통한 수익률 계산

### 컴포넌트 (`components/`)

#### `line-chart.tsx`

- 시장 데이터 시각화를 위한 메인 차트 컴포넌트
- 다중 시계열 데이터 지원
- 반응형 디자인
- 색상 커스터마이징 가능

#### `ui/` 디렉토리

- 재사용 가능한 기본 UI 컴포넌트들
- Radix UI 기반 접근성 높은 컴포넌트들
- `button.tsx` 등 공통 컴포넌트들

### 라이브러리 (`lib/`)

#### `indicators.ts`

- 기술적 분석 지표 계산 함수들
- `calculateSMA()`: 단순 이동평균 계산
- `momentumDirection()`: 모멘텀 방향 분석
- `TimeSeriesPoint`: 시계열 데이터 타입 정의

#### `utils.ts`

- 공통 유틸리티 함수들
- 날짜/숫자 포맷팅 함수들
- 데이터 변환 헬퍼 함수들

#### `mock-data.ts`

- 개발 및 테스트용 목업 데이터
- 실제 API가 사용할 수 없는 상황에서의 대체 데이터

## 주요 기능 구현

### 데이터 플로우

1. **데이터 수집**: Python 스크립트가 외부 API에서 원본 데이터 수집
2. **API 제공**: Next.js API 라우트가 가공된 데이터 제공
3. **프론트엔드**: React 컴포넌트가 데이터 시각화 및 상호작용

### 상태 관리

- React Hooks (useState, useEffect, useMemo)를 통한 클라이언트 상태 관리
- 실시간 데이터 갱신 기능
- 에러 처리 및 로딩 상태 관리

### 스타일링 전략

- **Tailwind CSS**: 유틸리티 기반 스타일링
- **CSS 변수**: 전역 색상 및 폰트 관리
- **반응형 디자인**: 모바일 우선 접근법
- **다크 모드**: CSS 변수 기반 테마 전환

## 개발 가이드라인

### 컴포넌트 개발

- 함수형 컴포넌트 사용
- TypeScript 타입 정의 필수
- Props 인터페이스 명시적 정의
- 접근성 속성 포함

### API 개발

- Next.js App Router 규칙 준수
- 적절한 HTTP 상태 코드 사용
- 에러 처리 미들웨어 구현
- 캐싱 전략 고려

### 타입 정의

```typescript
// 권장 패턴
interface ComponentProps {
  data: TimeSeriesPoint[];
  title: string;
  onUpdate?: () => void;
}

type ApiResponse = {
  symbols: string[];
  series: Record<string, PriceData[]>;
};
```

## 테스트 전략

현재 공식 테스트 프레임워크가 설정되어 있지 않으나, 다음과 같은 접근법을 권장합니다:

- **단위 테스트**: `lib/` 함수들에 대한 테스트
- **통합 테스트**: API 엔드포인트 테스트
- **E2E 테스트**: 주요 사용자 플로우 테스트

## 성능 최적화

- **코드 분할**: Next.js 자동 코드 분할 활용
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **번들링**: Turbopack을 통한 빠른 개발 환경
- **캐싱**: 적절한 데이터 캐싱 전략 구현

## 추가 리소스

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [React Hooks 문서](https://react.dev/reference/react)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
