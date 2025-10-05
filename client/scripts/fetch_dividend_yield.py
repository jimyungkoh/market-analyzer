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
        return start.tz_localize(None).normalize()  # type: ignore[attr-defined]
    except Exception:
        return pd.Timestamp(start).tz_localize(None).normalize()


def _to_month_end_index(index: "pd.Index") -> "pd.DatetimeIndex":
    dt_index = pd.DatetimeIndex(pd.to_datetime(index))
    dt_index = _coerce_tz_naive(dt_index)
    return dt_index.to_period("M").to_timestamp(how="end")


def _compute_sp500_yield(period: str) -> List[Dict[str, float]]:
    """
    SPY 기반 S&P 500 배당수익률(근사) 시계열을 계산합니다.

    - 배당: yf.Ticker("SPY").dividends → 실제 지급일 기준 일간 시리즈(0으로 채움)
    - 가격: yf.Ticker("SPY").history(interval="1d") → 일간 종가
    - 산식: 최근 365일 배당 합계(TTM)를 종가로 나눈 뒤 %로 환산
    """
    req_period = (period or "24mo").strip().lower()

    spy = yf.Ticker("SPY")

    # 요청 기간 시작 시각 계산 (이동평균 계산을 위해 버퍼 370일 확보)
    try:
        start_ts = _parse_period_to_start_ts(req_period)
    except Exception:
        start_ts = pd.Timestamp.now().tz_localize(None) - pd.DateOffset(months=24)
    start_ts = start_ts.normalize()
    buffer_start = (start_ts - pd.Timedelta(days=370)).normalize()

    # 일간 가격 데이터 로드 (버퍼 포함)
    try:
        df_daily = spy.history(
            start=buffer_start.to_pydatetime(),
            interval="1d",
            auto_adjust=False,
        )
        if df_daily.empty:
            df_daily = spy.history(period="max", interval="1d", auto_adjust=False)
    except Exception:
        df_daily = pd.DataFrame()

    if df_daily.empty:
        return []

    idxd = df_daily.index
    if isinstance(idxd, pd.DatetimeIndex):
        df_daily.index = _coerce_tz_naive(idxd)
    df_daily = df_daily.sort_index()

    if "Close" in df_daily.columns:
        close = df_daily["Close"].astype("float64")
    elif "Adj Close" in df_daily.columns:
        close = df_daily["Adj Close"].astype("float64")
    else:
        # 첫 번째 실수형 컬럼 사용
        close = None
        for c in df_daily.columns:
            s = df_daily[c]
            if hasattr(s, "dtype") and str(s.dtype).startswith("float"):
                close = s.astype("float64")
                break
        if close is None:
            return []

    close = close[~close.index.duplicated(keep="last")]
    close.index = close.index.normalize()

    # 배당 데이터 (전체 히스토리 사용)
    div_series = spy.dividends
    if div_series.empty:
        try:
            df_actions = spy.history(period="max", interval="1d", auto_adjust=False)
            if not df_actions.empty and "Dividends" in df_actions.columns:
                div_series = df_actions["Dividends"].astype("float64")
            else:
                div_series = pd.Series(dtype="float64")
        except Exception:
            div_series = pd.Series(dtype="float64")

    if isinstance(div_series.index, pd.DatetimeIndex):
        div_series.index = _coerce_tz_naive(div_series.index)
    else:
        try:
            div_series.index = pd.to_datetime(div_series.index)
        except Exception:
            div_series.index = pd.DatetimeIndex(div_series.index)
    div_series.index = div_series.index.normalize()
    div_series = div_series.astype("float64") if not div_series.empty else pd.Series(dtype="float64")
    div_series = div_series.sort_index()

    end_idx = close.index.max()
    full_index = pd.date_range(buffer_start, end_idx, freq="D")
    if div_series.empty:
        div_daily = pd.Series(0.0, index=full_index)
    else:
        div_daily = (
            div_series.resample("D").sum().reindex(full_index, fill_value=0.0)
        )

    # 최근 365일 배당 합계(TTM)
    div_ttm = div_daily.rolling(window=365, min_periods=60).sum()
    div_ttm_at_close = div_ttm.reindex(close.index, method="ffill")

    # 배당수익률 (%) 계산
    with pd.option_context("mode.use_inf_as_na", True):
        yield_pct = (div_ttm_at_close.astype("float64") / close.astype("float64")) * 100.0
    yield_pct = yield_pct.dropna()

    # 요청 기간 이후 데이터만 유지
    yield_pct = yield_pct[yield_pct.index >= start_ts]

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
    SPY ETF 일간 종가와 배당 정보를 사용해 일간 TTM 배당수익률(%) 시계열을 계산합니다.
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
