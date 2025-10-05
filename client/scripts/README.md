# Scripts for Market Data Fetching

이 디렉토리에는 시장 데이터(가격, 배당 수익률)를 가져오는 Python 스크립트가 있습니다.

## 사용법

### 직접 실행 (로컬 Python 환경)
필요한 라이브러리 설치:
```bash
pip install yfinance pandas
```

스크립트 실행 예시:
- 가격 데이터 가져오기: `python fetch_prices.py --tickers SPY,TIP`
- 배당 수익률 데이터 가져오기: `python fetch_dividend_yield.py --tickers SPY`

### Docker를 사용한 실행
Docker 환경에서 스크립트를 실행하려면, `client/` 디렉토리로 이동한 후 다음 명령어를 사용하세요.

1. 이미지 빌드:
   ```bash
   cd client
   docker build -t market-scripts .
   ```

2. 스크립트 실행 (볼륨 마운트로 호스트 데이터 공유):
   ```bash
   docker run --rm -v $(pwd)/scripts:/app/scripts market-scripts python fetch_prices.py --tickers SPY,TIP
   ```

   - `-v $(pwd)/scripts:/app/scripts`: 호스트의 scripts 디렉토리를 컨테이너에 마운트하여 출력 파일을 공유합니다.

3. docker-compose를 사용한 실행:
   ```bash
   cd client
   docker-compose up --build scripts
   ```

   - `docker-compose.yml` 파일을 통해 서비스를 정의하며, 빌드와 실행을 한 번에 처리합니다.
   - 볼륨 마운트가 설정되어 있어 호스트와 데이터가 공유됩니다.

출력 파일(예: prices.json, dividend_yield.json)은 scripts 디렉토리에 저장됩니다.