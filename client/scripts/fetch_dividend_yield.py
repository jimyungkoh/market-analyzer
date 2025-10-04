#!/usr/bin/env python3

import argparse
import json
import sys
from datetime import datetime, timezone
from typing import Dict, List, Tuple

try:
    import pandas as pd
    import yfinance as yf
except Exception as exc:  # pragma: no cover - executed only when deps missing
    sys.stderr.write(
        "[fetch_dividend_yield] Missing dependencies. Install with: pip install yfinance pandas\n"
    )
    sys.stderr.write(str(exc) + "\n")
    sys.exit(2)


def _coerce_tz_naive(index: "pd.DatetimeIndex") -> "pd.DatetimeIndex":
    tz = getattr(index, "tz", None)
    if tz is None:
        return index
    return index.tz_convert("UTC").tz_localize(None)


def _parse_period_to_start_ts(period: str) -> "pd.Timestamp":
    end = pd.Timestamp.now(tz="UTC")
    p = (period or "11mo").strip().lower()
    if p.endswith("mo"):
        months = int(p[:-2] or 11)
        start = end - pd.DateOffset(months=months)
    elif p.endswith("y"):
        years = int(p[:-1] or 1)
        start = end - pd.DateOffset(years=years)
    elif p.endswith("d"):
        days = int(p[:-1] or 30)
        start = end - pd.Timedelta(days=days)
    else:
        start = end - pd.DateOffset(months=11)
    # 비교 대상 인덱스는 tz-naive이므로 시작 시각도 tz 정보를 제거
    try:
        return start.tz_localize(None)  # type: ignore[attr-defined]
    except Exception:
        return pd.Timestamp(start).tz_localize(None)


def _to_month_end_index(index: "pd.Index") -> "pd.DatetimeIndex":
    dt_index = pd.DatetimeIndex(pd.to_datetime(index))
    dt_index = _coerce_tz_naive(dt_index)
    return dt_index.to_period("M").to_timestamp(how="end")


def _compute_sp500_yield(period: str) -> List[Dict[str, float]]:
    """
    SPY 기반 S&P 500 배당수익률(근사) 시계열을 계산합니다.
    - 배당: yf.Ticker("SPY").dividends → 월별 합계
    - 가격: yf.Ticker("SPY").history(interval="1mo") → 월말 종가
    - 산식: (월별 배당 합계의 12개월 롤링 TTM / 월말 종가) * 100
    """
    req_period = (period or "24mo").strip().lower()

    spy = yf.Ticker("SPY")

    # 배당 원천: dividends 시리즈 우선, 비어 있으면 history의 Dividends 컬럼 사용
    div_series = spy.dividends
    if isinstance(div_series.index, pd.DatetimeIndex):
        div_series.index = _coerce_tz_naive(div_series.index)
    if div_series.empty:
        try:
            df_actions = spy.history(period="max", interval="1d", auto_adjust=False)
            if not df_actions.empty and "Dividends" in df_actions.columns:
                idx = df_actions.index
                if isinstance(idx, pd.DatetimeIndex):
                    df_actions.index = _coerce_tz_naive(idx)
                div_series = df_actions["Dividends"].astype("float64")
            else:
                div_series = pd.Series(dtype=float)
        except Exception:
            div_series = pd.Series(dtype=float)

    # 가격 원천: 월간 history 우선, 비어 있으면 일간 후 월말 리샘플
    try:
        df_monthly = spy.history(period=req_period, interval="1mo", auto_adjust=False)
        if df_monthly.empty:
            df_monthly = spy.history(period="max", interval="1mo", auto_adjust=False)
    except Exception:
        df_monthly = pd.DataFrame()

    monthly_close: "pd.Series"
    if not df_monthly.empty and "Close" in df_monthly.columns:
        idxm = df_monthly.index
        if isinstance(idxm, pd.DatetimeIndex):
            df_monthly.index = _coerce_tz_naive(idxm)
        monthly_close = df_monthly["Close"]
    else:
        # 폴백: 일간 후 월말 리샘플
        try:
            df_daily = spy.history(period=req_period, interval="1d", auto_adjust=False)
            if df_daily.empty:
                df_daily = spy.history(period="max", interval="1d", auto_adjust=False)
            if df_daily.empty:
                return []
            idxd = df_daily.index
            if isinstance(idxd, pd.DatetimeIndex):
                df_daily.index = _coerce_tz_naive(idxd)
            if "Close" in df_daily.columns:
                monthly_close = df_daily["Close"].resample("ME").last()
            elif "Adj Close" in df_daily.columns:
                monthly_close = df_daily["Adj Close"].resample("ME").last()
            else:
                # 첫 번째 숫자 컬럼
                for c in df_daily.columns:
                    s = df_daily[c]
                    if hasattr(s, "dtype") and str(s.dtype).startswith("float"):
                        monthly_close = s.resample("ME").last()
                        break
                else:
                    return []
        except Exception:
            return []

    monthly_close = monthly_close.astype("float64")
    monthly_close.index = _to_month_end_index(monthly_close.index)
    monthly_close = monthly_close.sort_index()
    monthly_close = monthly_close[~monthly_close.index.duplicated(keep="last")]

    if monthly_close.empty:
        return []

    # 월별 배당 합계로 변환
    if div_series.empty:
        monthly_div = pd.Series(0.0, index=monthly_close.index)
    else:
        monthly_div = div_series.resample("M").sum()
        monthly_div.index = _to_month_end_index(monthly_div.index)
        monthly_div = monthly_div.reindex(monthly_close.index, fill_value=0.0)

    # 12개월 롤링 TTM 배당 합계
    monthly_ttm = monthly_div.rolling(window=12, min_periods=12).sum()
    monthly_ttm = monthly_ttm.reindex(monthly_close.index, method="ffill")

    # 배당수익률(%)
    try:
        yield_pct = (monthly_ttm.astype("float64") / monthly_close.astype("float64")) * 100.0
    except Exception:
        return []
    yield_pct = yield_pct.dropna()

    # 요청 기간 최근 N개월만
    def _months_from_period(p: str) -> int:
        p = (p or "11mo").strip().lower()
        if p.endswith("mo"):
            return max(1, int(p[:-2] or 11))
        if p.endswith("y"):
            return max(12, int(p[:-1] or 1) * 12)
        if p.endswith("d"):
            days = int(p[:-1] or 30)
            return max(1, int((days + 29) // 30))
        return 12

    months = _months_from_period(period)
    yield_pct = yield_pct.tail(months)

    out: List[Dict[str, float]] = []
    for idx2, val in yield_pct.items():
        try:
            scalar = float(val)
        except Exception:
            try:
                scalar = float(pd.to_numeric(val, errors="coerce"))
            except Exception:
                continue
        out.append({"date": _to_iso_date_safe(idx2), "value": round(float(scalar), 4)})
    return out


def _to_iso_date_safe(x) -> str:
    try:
        ts = pd.to_datetime(x)
        # Period 타입 등도 to_datetime 결과가 Timestamp가 됨
        return ts.date().isoformat()
    except Exception:
        # 최후 폴백: 문자열로 캐스팅
        return str(x)


def compute_dividend_yield_series(period: str, source: str = "spy") -> Dict[str, List[Dict[str, float]]]:
    """
    SPY ETF만 사용해 월별 TTM 배당수익률(%) 시계열을 계산합니다.
    """
    series = _compute_sp500_yield(period)
    return {"symbol": "SPY", "series": series}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--period", type=str, default="11mo")
    parser.add_argument("--source", type=str, default="spy")
    args = parser.parse_args()

    try:
        payload = compute_dividend_yield_series(args.period, args.source)
        print(json.dumps(payload))
    except Exception as exc:
        sys.stderr.write(f"[fetch_dividend_yield] Error: {exc}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
