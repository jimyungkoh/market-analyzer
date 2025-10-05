# Market Analyzer

시장 데이터를 분석하고 시각화하는 웹 애플리케이션 프로젝트입니다.

## 프로젝트 개요

이 프로젝트는 금융 시장 데이터를 수집, 분석, 시각화하는 풀스택 애플리케이션입니다. Next.js 15와 React 19를 사용하여 구축되었으며, 실시간 시장 데이터와 기술적 분석 지표를 제공합니다.

## 주요 기능

- **시장 데이터 수집**: Python 스크립트를 통한 실시간 가격 및 배당 데이터 수집
- **기술적 분석**: 이동평균선, RSI 등 다양한 기술적 지표 계산
- **데이터 시각화**: 인터랙티브한 차트를 통한 데이터 시각화
- **실시간 업데이트**: API 라우트를 통한 실시간 데이터 제공

## 프로젝트 구조

```
market-analyzer/
├── client/           # Next.js 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── app/      # Next.js App Router
│   │   ├── components/ # 재사용 가능한 컴포넌트들
│   │   └── lib/      # 유틸리티 함수 및 기술적 지표
│   └── scripts/      # Python 데이터 수집 스크립트
└── memo/             # 프로젝트 관련 문서 및 메모
```

## 기술 스택

### 프론트엔드

- **Next.js 15** - React 풀스택 프레임워크
- **React 19** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전한 JavaScript
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Radix UI** - 접근성 높은 컴포넌트 라이브러리

### 백엔드 및 데이터 처리

- **Python** - 데이터 수집 및 처리
- **yfinance** - 금융 데이터 API
- **pandas** - 데이터 분석 라이브러리

## 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.8+
- pnpm (Node.js 패키지 관리자)

### 설치 및 실행

1. **프론트엔드 의존성 설치**

   ```bash
   cd client
   pnpm install
   ```

2. **Python 패키지 설치**

   ```bash
   pip install yfinance pandas
   ```

3. **개발 서버 실행**

   ```bash
   cd client
   pnpm dev
   ```

4. **데이터 수집 스크립트 실행** (선택사항)
   ```bash
   cd client/scripts
   python fetch_prices.py --tickers SPY TIP
   ```

## 사용법

애플리케이션 실행 후 `http://localhost:3000`에서 다음 기능을 사용할 수 있습니다:

- 시장 데이터 차트 조회
- 기술적 분석 지표 확인
- 실시간 가격 정보
- 배당 수익률 분석

## 라이선스

이 프로젝트는 개인 학습 및 연구 목적으로 만들어졌습니다.
