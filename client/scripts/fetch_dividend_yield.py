#!/usr/bin/env python3

import argparse
import json
import sys
from typing import List, Dict

try:
    import yfinance as yf
    import pandas as pd
except Exception as e:
    sys.stderr.write("[fetch_dividend_yield] Missing dependencies. Install with: pip install yfinance pandas\n")
    sys.stderr.write(str(e) + "\n")
    sys.exit(2)


def compute_spy_dividend_yield_monthly(ticker: str = "SPY", period: str = "11mo") -> List[Dict]:
    if ticker != "SPY":
        raise ValueError("배당수익률 계산은 SPY 티커만 지원합니다")

    spy = yf.Ticker(ticker)

    # 현재 TTM yield 가져오기
    info = spy.info
    current_yield = info.get('trailingAnnualDividendYield', 0.0) * 100.0 if info.get('trailingAnnualDividendYield') else 0.0

    # 전체 dividends history - timezone 제거
    div_df = spy.dividends
    if not div_df.empty:
        div_df.index = div_df.index.tz_localize(None)

    monthly_div = div_df.resample("MS").sum() if not div_df.empty else pd.Series(dtype=float)

    # price history - timezone 제거
    price_df = spy.history(period=period, interval="1mo", auto_adjust=True)
    if not price_df.empty:
        price_df.index = price_df.index.tz_localize(None)

    if price_df.empty:
        today = pd.Timestamp.now().normalize().replace(day=1)
        return [{"date": today.date().isoformat(), "value": round(current_yield, 2)}]

    rows: List[Dict] = []
    for idx, row in price_df.iterrows():
        close = float(row.get("Close") or 0.0)
        if close <= 0:
            rows.append({"date": idx.date().isoformat(), "value": 0.0})
            continue

        # TTM: 과거 12개월 배당
        month_key = pd.Timestamp(year=idx.year, month=idx.month, day=1)
        start_ttm = month_key - pd.DateOffset(months=11)

        ttm_divs = monthly_div.loc[start_ttm:month_key].sum()
        yield_pct = (ttm_divs / close * 100.0) if close > 0 else 0.0

        # 최근 월에는 current_yield 적용
        now_ts = pd.Timestamp.now().normalize()
        if idx >= now_ts - pd.DateOffset(months=1):
            yield_pct = current_yield

        rows.append({
            "date": idx.date().isoformat(),
            "value": round(yield_pct, 2)
        })

    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ticker", type=str, default="SPY")
    parser.add_argument("--period", type=str, default="11mo")
    args = parser.parse_args()

    try:
        series = compute_spy_dividend_yield_monthly(args.ticker, args.period)
        print(json.dumps({"symbol": "SPY_DIVIDEND_YIELD", "series": series}))
    except Exception as e:
        sys.stderr.write(f"[fetch_dividend_yield] Error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
