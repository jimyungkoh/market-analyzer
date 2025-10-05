# Market Analyzer: 기술 심층 분석

이 문서는 Market Analyzer 프로젝트의 아키텍처, 데이터 흐름, 기술 스택 및 주요 구현 전략을 상세히 설명합니다.

## 1. 프로젝트 개요

Market Analyzer는 금융 시장 데이터를 시각화하고, 특정 투자 전략에 기반한 위험 신호를 포착하기 위해 구축된 풀스택 웹 애플리케이션입니다. 사용자는 두 가지 주요 위험 평가 모델을 통해 현재 시장 상황에 대한 인사이트를 얻을 수 있습니다.

- **옵션 A**: SPY (S&P 500 ETF)와 TIP (물가연동채 ETF)의 가격 모멘텀을 분석하여 시장의 위험 선호도를 평가합니다.
- **옵션 B**: S&P 500의 배당수익률을 장기 이동평균과 비교하여 밸류에이션 기반의 위험 신호를 탐지합니다.

## 2. 시스템 아키텍처 및 데이터 흐름

본 프로젝트는 최신 웹 기술 스택을 활용한 모놀리식 아키텍처를 기반으로 하며, 데이터 처리의 효율성을 위해 **Node.js와 Python 환경을 결합**한 독특한 구조를 가집니다.

```
+----------------+      +---------------------+      +----------------+      +----------------------+      +-----------------+
|   사용자 (브라우저)  |  ->  |   Next.js 프론트엔드   |  ->  |  Next.js API 라우트  |  ->  |  로컬 SQLite 데이터베이스  |  <-> |   Python 스크립트    |
| (React 컴포넌트) |      | (app/page.tsx)      |      | (app/api/*)         |      | (Drizzle ORM)        |      | (yfinance)      |
+----------------+      +---------------------+      +----------------+      +----------------------+      +-----------------+
                                                                                                                   |
                                                                                                                   v
                                                                                                           +-----------------+
                                                                                                           |  Yahoo Finance  |
                                                                                                           +-----------------+
```

1.  **프론트엔드 요청**: 사용자가 웹 페이지에 접속하면, `page.tsx` 컴포넌트가 필요한 데이터를 `/api/prices`와 `/api/spy-dividend-yield` 엔드포인트에 요청합니다.
2.  **API 라우트 처리**:
    -   API 라우트는 요청을 받은 후, 먼저 로컬 **SQLite 데이터베이스**에 필요한 데이터가 있는지, 그리고 데이터가 최신 상태인지 확인합니다.
    -   **캐시 히트 (Cache Hit)**: 데이터가 존재하고 최신이라면, 즉시 데이터베이스에서 데이터를 조회하여 프론트엔드에 반환합니다.
    -   **캐시 미스 (Cache Miss)**: 데이터가 없거나 오래되었다면, API 라우트는 `child_process.spawn`을 통해 해당 데이터를 가져오는 **Python 스크립트**(`fetch_prices.py` 또는 `fetch_dividend_yield.py`)를 실행합니다.
3.  **Python 데이터 수집**:
    -   Python 스크립트는 `yfinance` 라이브러리를 사용하여 Yahoo Finance에서 최신 주가 및 배당 데이터를 가져옵니다.
    -   데이터를 가공하여 표준 출력(stdout)으로 JSON 형식의 문자열을 출력합니다.
4.  **데이터베이스 업데이트 및 응답**:
    -   API 라우트는 Python 스크립트의 출력을 받아 JSON으로 파싱합니다.
    -   `Drizzle ORM`을 사용하여 파싱된 데이터를 SQLite 데이터베이스에 삽입(upsert)하여 캐시를 업데이트합니다.
    -   업데이트된 데이터를 프론트엔드에 최종적으로 응답합니다.
5.  **시각화**: 프론트엔드는 수신한 데이터를 `Recharts` 라이브러리를 사용해 대화형 차트로 시각화합니다.

이러한 "Cache-Aside" 패턴과 유사한 접근 방식은 외부 API 호출을 최소화하여 응답 속도를 개선하고, API 키 없이도 안정적으로 데이터를 제공하는 장점이 있습니다.

## 3. 기술 스택

### 프론트엔드
- **Next.js 15**: React의 풀스택 프레임워크. App Router를 사용합니다.
- **React 19**: UI 구축을 위한 라이브러리.
- **TypeScript**: 타입 안정성을 제공합니다.
- **Tailwind CSS**: 유틸리티 우선의 CSS 프레임워크.
- **Recharts**: D3.js 기반의 대화형 차트 라이브러리.
- **Radix UI**: 접근성을 고려한 UI 프리미티브.

### 백엔드 및 데이터 처리
- **Next.js API Routes**: 백엔드 로직을 처리하는 서버리스 함수.
- **Node.js**: JavaScript 런타임 (`child_process`를 통한 Python 연동).
- **Python**: `yfinance`와 `pandas`를 사용한 외부 금융 데이터 수집 및 가공.
- **Drizzle ORM**: 타입 안전한 SQL 쿼리 빌더 및 ORM.
- **better-sqlite3**: 고성능 SQLite 데이터베이스 드라이버.

## 4. 프로젝트 구조 (주요 파일)

```
client/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── prices/route.ts         # 주가 데이터 API
│   │   │   └── spy-dividend-yield/route.ts # 배당수익률 API
│   │   ├── _components/
│   │   │   └── ChartCard.tsx           # 재사용 가능한 차트 컴포넌트
│   │   ├── page.tsx                    # 메인 페이지 UI 및 로직
│   │   └── layout.tsx                  # 전역 레이아웃
│   ├── components/
│   │   └── ui/                         # Shadcn/ui 기반 기본 컴포넌트
│   ├── db/
│   │   ├── schema.ts                   # Drizzle ORM 데이터베이스 스키마
│   │   └── client.ts                   # 데이터베이스 클라이언트
│   └── lib/
│       ├── db-helpers.ts               # DB 관련 헬퍼 함수
│       ├── indicators.ts               # 기술적 분석 지표 (SMA 등) 계산
│       └── runPythonScript.ts          # Python 스크립트 실행 래퍼
└── scripts/
    ├── fetch_prices.py                 # yfinance를 이용한 주가 데이터 수집
    └── fetch_dividend_yield.py         # 배당 데이터를 이용한 수익률 계산
```

## 5. 설치 및 실행 방법

1.  **저장소 복제 및 의존성 설치**:
    ```bash
    # pnpm monorepo 설정에 따라 루트에서 설치
    pnpm install
    ```

2.  **Python 의존성 설치**:
    ```bash
    # Python 가상환경 생성을 권장
    python -m venv .venv
    source .venv/bin/activate
    pip install yfinance pandas
    ```

3.  **데이터베이스 마이그레이션**:
    Drizzle Kit를 사용하여 `schema.ts`를 기반으로 데이터베이스를 초기화합니다.
    ```bash
    cd client
    pnpm db:push
    ```

4.  **개발 서버 실행**:
    ```bash
    # /client 디렉토리에서 실행
    pnpm dev
    ```
    이제 `http://localhost:3000`에서 애플리케이션을 확인할 수 있습니다.

## 6. 주요 기능 및 로직

### 위험 회피 옵션 A: 모멘텀 전략
- `lib/indicators.ts`의 `calculateSMA` 함수로 20일 단순 이동평균(SMA)을 계산합니다.
- `momentumDirection` 함수는 최근 10일간의 SMA 기울기를 분석하여 'up', 'down', 'flat' 모멘텀을 결정합니다.
- SPY 또는 TIP 중 하나라도 모멘텀이 'down'이면 '위험' 상태로 간주합니다.

### 위험 회피 옵션 B: 배당수익률 전략
- `scripts/fetch_dividend_yield.py` 스크립트는 SPY의 일별 종가와 배당금 내역을 사용하여 후행 12개월(TTM) 배당수익률을 계산합니다.
- `page.tsx`에서는 이 배당수익률과 120일 단순 이동평균을 비교합니다.
- 현재 배당수익률이 120일 SMA보다 낮으면 '위험' 상태로 간주합니다. 이 모델은 배당수익률이 역사적 평균보다 낮을 때 시장이 고평가되었을 수 있다는 가정에 기반합니다.