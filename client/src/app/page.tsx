"use client";

import { Button } from "@/components/ui/button";
import {
  calculateSMA,
  momentumDirection,
  TimeSeriesPoint,
} from "@/lib/indicators";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChartCard from "./_components/ChartCard";

type PricesApiResponse = {
  symbols: string[];
  series: Record<string, { date: string; value: number }[]>;
};

type YieldApiResponse = {
  symbol: string;
  series: { date: string; value: number }[];
};

function toPoints(rows: { date: string; value: number }[]): TimeSeriesPoint[] {
  return rows.map((r) => ({ date: new Date(r.date), value: r.value }));
}

export default function Home() {
  const [spy, setSpy] = useState<TimeSeriesPoint[]>([]);
  const [tip, setTip] = useState<TimeSeriesPoint[]>([]);
  const [spxYield, setSpxYield] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pricesRes, yieldRes] = await Promise.all([
        fetch(`/api/prices?tickers=SPY,TIP&period=11mo&interval=1d`, {
          cache: "no-store",
        }),
        fetch(`/api/spy-dividend-yield?period=11mo`, { cache: "no-store" }),
      ]);

      if (!pricesRes.ok)
        throw new Error(`prices api error ${pricesRes.status}`);
      if (!yieldRes.ok) throw new Error(`yield api error ${yieldRes.status}`);

      const pricesJson: PricesApiResponse = await pricesRes.json();
      const yieldJson: YieldApiResponse = await yieldRes.json();

      setSpy(toPoints(pricesJson.series["SPY"] || []));
      setTip(toPoints(pricesJson.series["TIP"] || []));
      setSpxYield(toPoints(yieldJson.series || []));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maWindow = 20; // 20일 단순 이동평균
  const { spySma, tipSma, spyMomentum, tipMomentum, isRiskA } = useMemo(() => {
    const spySmaLocal = calculateSMA(spy, maWindow);
    const tipSmaLocal = calculateSMA(tip, maWindow);
    const spyMom = momentumDirection(spySmaLocal, 10);
    const tipMom = momentumDirection(tipSmaLocal, 10);
    return {
      spySma: spySmaLocal,
      tipSma: tipSmaLocal,
      spyMomentum: spyMom,
      tipMomentum: tipMom,
      isRiskA: spyMom === "down" || tipMom === "down",
    };
  }, [spy, tip]);

  const latestYield = useMemo(
    () => spxYield[spxYield.length - 1]?.value ?? 0,
    [spxYield]
  );
  const isRiskB = latestYield <= 1.32;

  return (
    <div className="font-sans min-h-screen p-8 sm:p-12">
      <main className="mx-auto w-full max-w-6xl flex flex-col gap-10">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Market Analyzer</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {loading ? (
              <span>로딩 중…</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : null}
            <Button variant="outline" onClick={loadData} disabled={loading}>
              갱신
            </Button>
          </div>
        </header>

        {/* 옵션 A */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-semibold">위험 회피 옵션 A</h2>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${
                  isRiskA
                    ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {isRiskA ? "위험" : "안정"}
              </span>
              <span className="text-xs text-zinc-500">
                SMA(20) 모멘텀: SPY {spyMomentum} / TIP {tipMomentum}
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            SPY와 TIP의 11개월 가격 데이터와 이동평균을 기반으로 최근
            모멘텀(기울기)을 평가합니다.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartCard
              title="SPY"
              series={[
                { name: "SPY", data: spy },
                { name: "SPY SMA(20)", data: spySma, color: "#ef4444" },
              ]}
              height={220}
            />
            <ChartCard
              title="TIP"
              series={[
                { name: "TIP", data: tip, color: "#06b6d4" },
                { name: "TIP SMA(20)", data: tipSma, color: "#16a34a" },
              ]}
              height={220}
            />
          </div>
        </section>

        {/* 옵션 B */}
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-semibold">위험 회피 옵션 B</h2>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${
                  isRiskB
                    ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {isRiskB ? "위험" : "안정"}
              </span>
              <span className="text-xs text-zinc-500">
                S&P 500 배당수익률 임계값 1.32%
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            최근 배당수익률이 1.32% 이하이면 위험 신호를 표시합니다.
          </p>

          <div className="mt-4">
            <ChartCard
              series={[
                {
                  name: "S&P 500 Dividend Yield (%)",
                  data: spxYield,
                  color: "#f59e0b",
                },
              ]}
              height={240}
            />
          </div>
        </section>

        <footer className="pt-4 text-xs text-zinc-500">
          데이터 출처: yfinance(SPY/TIP 종가, SPY 배당을 통한 배당수익률 근사).
          로컬 파이썬 실행 필요.
        </footer>
      </main>
    </div>
  );
}
