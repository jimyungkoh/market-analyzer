# Market Analyzer - Client

Next.js 15 기반의 시장 분석 웹 애플리케이션 프론트엔드입니다.

## 프로젝트 개요

이 프로젝트는 현대적인 웹 기술을 사용하여 금융 시장 데이터를 시각화하고 분석하는 사용자 인터페이스를 제공합니다. Next.js 15의 App Router와 React 19를 기반으로 구축되었으며, 타입 안전성과 우수한 사용자 경험을 목표로 합니다.

## 주요 기능

- **실시간 차트**: 시장 데이터의 인터랙티브한 시각화
- **기술적 분석**: RSI, 이동평균선 등 다양한 지표
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **API 연동**: 백엔드 API와 실시간 데이터 통신

## 기술 스택

### 코어 프레임워크

- **Next.js 15** - App Router 기반 풀스택 프레임워크
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 타입 안전한 개발 환경

### 스타일링 및 UI

- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Radix UI** - 접근성 높은 컴포넌트 라이브러리
- **Lucide React** - 아이콘 라이브러리
- **class-variance-authority** - 컴포넌트 변형 관리

### 개발 도구

- **ESLint** - 코드 린팅 (next/core-web-vitals 설정)
- **TypeScript** - 타입 체크 및 IntelliSense
- **Turbopack** - 빠른 번들링 및 개발 서버

## 프로젝트 구조

```
client/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API 라우트 핸들러
│   │   ├── globals.css     # 전역 스타일
│   │   ├── layout.tsx      # 루트 레이아웃
│   │   └── page.tsx        # 홈페이지
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── ui/            # 기본 UI 컴포넌트
│   │   └── line-chart.tsx # 차트 컴포넌트
│   └── lib/               # 유틸리티 및 비즈니스 로직
│       ├── indicators.ts  # 기술적 분석 지표
│       ├── mock-data.ts   # 목업 데이터
│       └── utils.ts       # 공통 유틸리티 함수
├── scripts/               # Python 데이터 수집 스크립트
└── public/               # 정적 파일들
```

## 개발 환경 설정

### 사전 요구사항

- **Node.js 18+**
- **pnpm (Node.js 패키지 관리자)**

### 설치 및 실행

1. **프로젝트 디렉토리로 이동**

   ```bash
   cd client
   ```

2. **의존성 설치**

   ```bash
   pnpm install
   ```

3. **개발 서버 실행**

   ```bash
   pnpm dev
   ```

   서버가 `http://localhost:3000`에서 실행됩니다.

4. **프로덕션 빌드**
   ```bash
   pnpm build
   pnpm start
   ```

### 사용 가능한 스크립트

- `pnpm dev` - Turbopack 개발 서버 실행
- `pnpm build` - 프로덕션 빌드 생성
- `pnpm start` - 프로덕션 서버 실행
- `pnpm lint` - ESLint 코드 검사
- `pnpm db:push` - Drizzle로 SQLite 스키마 동기화 (`client/.data/market.db`)
- `pnpm db:studio` - Drizzle Studio 실행

## 개발 가이드라인

### 코딩 표준

- **TypeScript**: 모든 파일에 타입 정의 사용
- **ESLint**: `next/core-web-vitals` 설정 준수
- **Import 경로**: `@/` prefix를 사용한 절대 경로 사용
- **컴포넌트**: PascalCase 파일명 (예: `MarketChart.tsx`)

### 스타일링 가이드라인

- **Tailwind CSS**: 클래스명은 의미 있는 그룹으로 정렬
- **컴포넌트**: `cn()` 유틸리티를 통한 클래스 병합
- **반응형**: 모바일 우선 접근법 사용

### API 라우트 개발

- `src/app/api/` 하위에 라우트 생성
- Next.js 15 App Router 규칙 준수
- 적절한 HTTP 상태 코드 반환

## 데이터 저장(로컬 캐시)

API 라우트가 먼저 SQLite(Drizzle)에서 데이터를 조회하고, 커버리지가 부족하거나 최신치가 없을 때에만 Python 스크립트를 호출해 수집/업서트합니다. DB 파일은 `client/.data/market.db`에 생성됩니다.

## 데이터 수집 스크립트

Python 스크립트를 사용하여 외부 API에서 시장 데이터를 수집할 수 있습니다:

```bash
# 가격 데이터 수집
python scripts/fetch_prices.py --tickers SPY TIP

# 배당 수익률 데이터 수집
python scripts/fetch_dividend_yield.py
```

## 환경 변수

`.env.local` 파일을 생성하여 다음 환경변수를 설정할 수 있습니다:

```env
# API 설정
API_BASE_URL=http://localhost:3000/api

# 외부 API 키 (필요시)
ALPHA_VANTAGE_API_KEY=your_api_key
```

## 배포

### Vercel (권장)

1. Vercel 계정에 프로젝트 연결
2. 자동 배포 설정
3. 환경변수 설정

### 기타 플랫폼

- 프로덕션 빌드 생성: `pnpm build`
- 정적 파일로 배포 가능

## 문제 해결

### 일반적인 문제들

1. **포트 충돌**: `pnpm dev -- -p 3001`로 다른 포트 사용
2. **모듈 설치 오류**: `pnpm install`로 클린 설치 시도
3. **타입 오류**: `pnpm build`로 타입 체크 실행

### 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [React 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [프로젝트 규칙](./../CRUSH.md)

## 라이선스

이 프로젝트는 학습 및 개발 목적으로 만들어졌습니다.
