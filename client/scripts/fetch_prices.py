#!/usr/bin/env python3

import argparse
import json
import sys
from typing import Dict, List

try:
    import yfinance as yf
    import pandas as pd
except Exception as e:
    sys.stderr.write("[fetch_prices] Missing dependencies. Install with: pip install yfinance pandas\n")
    sys.stderr.write(str(e) + "\n")
    sys.exit(2)


def df_to_series_per_symbol(df: "pd.DataFrame", symbols: List[str]) -> Dict[str, List[Dict[str, float]]]:
    result = {}
    # Try to prefer Close, fallback to Adj Close
    def pick_col(df_: "pd.DataFrame"):
        if "Close" in df_.columns:
            return df_["Close"]
        if "Adj Close" in df_.columns:
            return df_["Adj Close"]
        # Some dataframes may use lowercase
        for c in df_.columns:
            if c.lower() == "close" or c.lower() == "adj close":
                return df_[c]
        raise RuntimeError("No Close/Adj Close column found")

    if len(symbols) == 1:
        s = pick_col(df).dropna()
        result[symbols[0]] = [
            {"date": idx.date().isoformat(), "value": float(v)} for idx, v in s.items()
        ]
        return result

    # Multi-index columns: (symbol, field)
    for sym in symbols:
        if (sym, "Close") in df.columns:
            s = df[(sym, "Close")].dropna()
        elif (sym, "Adj Close") in df.columns:
            s = df[(sym, "Adj Close")].dropna()
        else:
            # Fallback: try any column containing Close
            close_cols = [c for c in df.columns if isinstance(c, tuple) and c[0] == sym]
            if not close_cols:
                result[sym] = []
                continue
            # pick first
            s = df[close_cols[0]].dropna()
        result[sym] = [
            {"date": idx.date().isoformat(), "value": float(v)} for idx, v in s.items()
        ]
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tickers", type=str, required=True, help="Comma separated tickers e.g. SPY,TIP")
    parser.add_argument("--period", type=str, default="11mo", help="e.g. 11mo, 1y, 6mo")
    parser.add_argument("--interval", type=str, default="1d", help="e.g. 1d, 1wk, 1mo")
    args = parser.parse_args()

    symbols = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    if not symbols:
        raise SystemExit("No tickers provided")

    try:
        df = yf.download(
            tickers=symbols,
            period=args.period,
            interval=args.interval,
            auto_adjust=True,
            threads=True,
            group_by="ticker",
            progress=False,
        )

        # yfinance returns different shapes for single vs multi tickers. Normalize.
        series_map = df_to_series_per_symbol(df, symbols)

        payload = {
            "symbols": symbols,
            "series": series_map,
        }
        print(json.dumps(payload))
    except Exception as e:
        sys.stderr.write(f"[fetch_prices] Error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()


