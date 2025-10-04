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


def _to_utc_naive_index(index: "pd.Index") -> "pd.Index":
    tz = getattr(index, "tz", None)
    if tz is None:
        return index
    return index.tz_convert("UTC").tz_localize(None)


def compute_spy_dividend_yield_monthly(ticker: str = "SPY", period: str = "11mo") -> List[Dict]:
    # SPY 배당수익률만 계산 (SPX의 proxy로 사용)
    if ticker != "SPY":
        raise ValueError("배당수익률 계산은 SPY 티커만 지원합니다")

    spy = yf.Ticker(ticker)

    # 현재 TTM yield 가져오기 (yfinance info에서)
    info = spy.info
    current_yield = info.get('trailingAnnualDividendYield', 0.0) * 100.0 if info.get('trailingAnnualDividendYield') else 0.0

    # 전체 dividends history
    div_df = spy.dividends
    if not div_df.empty:
        div_df = div_df.copy()
        div_df.index = _to_utc_naive_index(div_df.index)
    monthly_div = div_df.resample("MS").sum() if not div_df.empty else pd.Series(dtype=float)
    if not monthly_div.empty:
        monthly_div.index = _to_utc_naive_index(monthly_div.index)

    # price history (monthly, 지정된 period)
    price_df = spy.history(period=period, interval="1mo", auto_adjust=True)
    if not price_df.empty:
        price_df = price_df.copy()
        price_df.index = _to_utc_naive_index(price_df.index)
    if price_df.empty:
        # 빈 경우 현재 yield로 채움
        today = pd.Timestamp.utcnow().replace(day=1)
        return [{"date": today.date().isoformat(), "value": round(current_yield, 2)}]

    rows: List[Dict] = []
    for idx, row in price_df.iterrows():
        idx_ts = idx if isinstance(idx, pd.Timestamp) else pd.Timestamp(idx)
        if getattr(idx_ts, "tz", None) is not None:
            idx_ts = idx_ts.tz_convert("UTC").tz_localize(None)

        close = float(row.get("Close") or 0.0)
        if close <= 0:
            rows.append({"date": idx_ts.date().isoformat(), "value": 0.0})
            continue

        # TTM: 이 월부터 과거 12개월 총 배당
        month_key = pd.Timestamp(year=idx_ts.year, month=idx_ts.month, day=1)
        # 과거 12개월 기간: month_key - 11개월 ~ month_key
        start_ttm = month_key - pd.DateOffset(months=11)
        ttm_divs = monthly_div.loc[start_ttm:month_key].sum()
        yield_pct = (ttm_divs / close * 100.0) if close > 0 else 0.0

        # 최근 월(현재 월)에 current_yield 적용 (더 정확한 값)
        now_ts = pd.Timestamp.utcnow().normalize()
        if idx_ts >= now_ts - pd.DateOffset(months=1):
            yield_pct = current_yield

        rows.append({
            "date": idx_ts.date().isoformat(),
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


