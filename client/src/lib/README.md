# 라이브러리 (lib/)

유틸리티 함수와 비즈니스 로직이 포함된 라이브러리 디렉토리입니다.

## 개요

이 디렉토리에는 애플리케이션의 핵심 로직과 공통 기능이 구현되어 있습니다. 기술적 분석 지표 계산, 데이터 변환, 그리고 일반적인 유틸리티 함수들이 포함되어 있으며, 다른 모듈들이 재사용할 수 있도록 설계되었습니다.

## 디렉토리 구조

```
lib/
├── indicators.ts    # 기술적 분석 지표 계산 함수들
├── utils.ts        # 공통 유틸리티 함수들
└── mock-data.ts    # 개발용 목업 데이터
```

## 주요 모듈 설명

### 기술적 분석 지표 (`indicators.ts`)

금융 데이터 분석을 위한 기술적 지표 계산 함수들을 제공합니다.

#### 타입 정의

**TimeSeriesPoint**
시계열 데이터의 기본 타입입니다.

```typescript
type TimeSeriesPoint = {
  date: Date;
  value: number;
};
```

#### 주요 함수들

##### `calculateSMA(data, windowSize)`

단순 이동평균(Simple Moving Average)을 계산합니다.

**파라미터:**

- `data: TimeSeriesPoint[]` - 입력 시계열 데이터
- `windowSize: number` - 이동평균 윈도우 크기

**반환값:** `TimeSeriesPoint[]` - 계산된 이동평균 시계열

**사용법:**

```typescript
import { calculateSMA, TimeSeriesPoint } from "@/lib/indicators";

const prices: TimeSeriesPoint[] = [
  { date: new Date("2024-01-01"), value: 100 },
  { date: new Date("2024-01-02"), value: 105 },
  // ... 더 많은 데이터
];

const sma20 = calculateSMA(prices, 20);
```

##### `slopeLast(series, lookback?)`

최근 데이터 포인트들의 선형 회귀 기울기를 계산합니다.

**파라미터:**

- `series: TimeSeriesPoint[]` - 입력 시계열 데이터
- `lookback?: number` - 분석할 최근 데이터 포인트 수 (기본값: 5)

**반환값:** `number` - 계산된 기울기 값

##### `momentumDirection(series, lookback?)`

시계열 데이터의 모멘텀 방향을 판단합니다.

**파라미터:**

- `series: TimeSeriesPoint[]` - 입력 시계열 데이터
- `lookback?: number` - 분석할 최근 데이터 포인트 수 (기본값: 5)

**반환값:** `"up" | "down" | "flat"` - 모멘텀 방향

**사용법:**

```typescript
import { momentumDirection } from "@/lib/indicators";

const direction = momentumDirection(priceData, 10);
if (direction === "up") {
  console.log("상승 추세입니다");
}
```

#### 알고리즘 구현

이 모듈은 금융 공학 분야의 표준 알고리즘을 구현합니다:

- **단순 이동평균**: 효율적인 슬라이딩 윈도우 알고리즘 사용
- **선형 회귀**: 최소자승법을 통한 기울기 계산
- **모멘텀 분석**: 기울기 부호를 통한 추세 방향 판단

### 유틸리티 함수 (`utils.ts`)

공통적으로 사용되는 유틸리티 함수들을 제공합니다.

#### `cn(...inputs)`

Tailwind CSS 클래스명을 조건부로 병합하는 함수입니다.

**파라미터:**

- `inputs: ClassValue[]` - 병합할 클래스명 배열

**반환값:** `string` - 병합된 클래스명 문자열

**사용법:**

```typescript
import { cn } from "@/lib/utils";

// 조건부 클래스 적용
<div className={cn(
  "base-class",
  isActive && "active-class",
  size === "large" && "large-class"
)}>
```

**기반 라이브러리:**

- `clsx`: 조건부 클래스명 처리
- `tailwind-merge`: Tailwind CSS 클래스 충돌 해결

### 목업 데이터 (`mock-data.ts`)

개발과 테스트를 위한 목업 데이터를 제공합니다.

**용도:**

- API 개발 중 실제 데이터 대신 사용
- UI 컴포넌트 개발 및 테스트
- 데모 및 프레젠테이션

## 개발 가이드라인

### 함수 설계 원칙

1. **순수 함수**: 동일한 입력에 대해 항상 동일한 출력 반환
2. **타입 안전성**: TypeScript 타입 정의 필수
3. **에러 처리**: 적절한 입력 검증 및 에러 메시지
4. **성능 고려**: 대용량 데이터 처리 시 효율적인 알고리즘 사용

### 금융 계산 주의사항

기술적 분석 함수들은 금융 데이터를 다루므로 다음과 같은 주의가 필요합니다:

- **날짜 처리**: 타임존과 날짜 형식을 정확히 처리
- **숫자 정밀도**: 부동소수점 연산 시 정밀도 문제 고려
- **엣지 케이스**: 빈 배열, 단일 데이터 포인트 등 예외 상황 처리
- **수학적 유효성**: 분모가 0인 경우 등 수학적 예외 처리

### 테스트 전략

핵심 비즈니스 로직이므로 다음과 같은 테스트가 필요합니다:

- **단위 테스트**: 각 함수의 정확성 검증
- **엣지 케이스 테스트**: 빈 배열, 단일 값, 극단값 등
- **성능 테스트**: 대용량 데이터 처리 성능 검증
- **회귀 테스트**: 금융 공식 변경 시 결과 검증

## 사용 예시

### 기술적 분석 지표 활용

```typescript
import {
  calculateSMA,
  momentumDirection,
  TimeSeriesPoint,
} from "@/lib/indicators";

// 1. 이동평균 계산
const prices: TimeSeriesPoint[] = getPriceData();
const sma20 = calculateSMA(prices, 20);

// 2. 모멘텀 방향 분석
const momentum = momentumDirection(sma20, 10);

// 3. 투자 전략 결정
if (momentum === "up") {
  executeBuyStrategy();
} else if (momentum === "down") {
  executeSellStrategy();
}
```

### 스타일링 유틸리티 활용

```typescript
import { cn } from "@/lib/utils";

function StatusBadge({ active, large }: { active: boolean; large?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
        large && "px-3 py-1 text-base"
      )}
    >
      {active ? "활성" : "비활성"}
    </span>
  );
}
```

## 추가 리소스

- [기술적 분석 개론](https://www.investopedia.com/terms/t/technicalanalysis.asp)
- [이동평균 전략](https://www.investopedia.com/articles/active-trading/052014/how-use-moving-average-buy-stocks.asp)
- [선형 회귀 분석](https://www.investopedia.com/terms/l/linear-regression.asp)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
