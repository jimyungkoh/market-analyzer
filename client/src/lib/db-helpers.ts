import { getDb } from "@/db/client";
import { dividendYields, prices } from "@/db/schema";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

// ---- Zod Schemas (Python 출력 검증) ----
export const zSeriesPoint = z.object({ date: z.string(), value: z.number() });

export const zPricesApi = z.object({
  symbols: z.array(z.string()),
  series: z.record(z.array(zSeriesPoint)),
});

export const zYieldApi = z.object({
  symbol: z.string(),
  series: z.array(zSeriesPoint),
});

// ---- Upsert helpers ----
export async function upsertPricesFromPythonJSON(
  payload: unknown,
  interval: string
) {
  const parsed = zPricesApi.parse(payload);
  const db = getDb();

  // 트랜잭션 내 일괄 업서트
  db.transaction((tx) => {
    for (const symbol of parsed.symbols) {
      const rows = parsed.series[symbol] || [];
      if (!rows.length) continue;
      // SQLite 다중 upsert: values → onConflictDoUpdate
      tx
        .insert(prices)
        .values(
          rows.map((r) => ({
            symbol,
            date: r.date,
            interval,
            close: r.value,
          }))
        )
        .onConflictDoUpdate({
          target: [prices.symbol, prices.date, prices.interval],
          set: { close: sql`excluded.close` },
        })
        .run();
    }
  });
}

export async function upsertDividendYieldFromPythonJSON(payload: unknown) {
  const parsed = zYieldApi.parse(payload);
  const db = getDb();
  const symbol = parsed.symbol;
  const rows = parsed.series;

  if (!rows.length) return;

  db
    .insert(dividendYields)
    .values(rows.map((r) => ({ symbol, date: r.date, value: r.value })))
    .onConflictDoUpdate({
      target: [dividendYields.symbol, dividendYields.date],
      set: { value: sql`excluded.value` },
    })
    .run();
}

// ---- Query helpers ----
export async function queryPricesRange(
  symbols: string[],
  startDate: string,
  endDate: string,
  interval = "1d"
) {
  const db = getDb();
  const rows = await db
    .select({ symbol: prices.symbol, date: prices.date, value: prices.close })
    .from(prices)
    .where(
      and(
        inArray(prices.symbol, symbols),
        eq(prices.interval, interval),
        gte(prices.date, startDate),
        lte(prices.date, endDate)
      )
    )
    .orderBy(prices.symbol, prices.date);

  const series: Record<string, { date: string; value: number }[]> = {};
  for (const s of symbols) series[s] = [];
  for (const r of rows) {
    (series[r.symbol] ||= []).push({ date: r.date, value: r.value });
  }
  return { symbols, series };
}

export async function queryDividendYieldRange(
  symbol: string,
  startDate: string,
  endDate: string
) {
  const db = getDb();
  const rows = await db
    .select({ date: dividendYields.date, value: dividendYields.value })
    .from(dividendYields)
    .where(
      and(
        eq(dividendYields.symbol, symbol),
        gte(dividendYields.date, startDate),
        lte(dividendYields.date, endDate)
      )
    )
    .orderBy(dividendYields.date);
  return { symbol, series: rows };
}

// ---- Coverage helpers ----
export async function getLatestDateForPrices(
  symbols: string[],
  interval = "1d"
) {
  const db = getDb();
  const results: Record<string, string | null> = {};
  for (const s of symbols) {
    const row = await db
      .select({ maxDate: sql<string>`max(${prices.date})`.as("maxDate") })
      .from(prices)
      .where(and(eq(prices.symbol, s), eq(prices.interval, interval)));
    results[s] = (row[0]?.maxDate as unknown as string) ?? null;
  }
  return results;
}

export async function getLatestDateForDividend(symbol: string) {
  const db = getDb();
  const row = await db
    .select({ maxDate: sql<string>`max(${dividendYields.date})`.as("maxDate") })
    .from(dividendYields)
    .where(eq(dividendYields.symbol, symbol));
  return (row[0]?.maxDate as unknown as string) ?? null;
}

export function computeStartEndByPeriod(period: string) {
  const now = new Date();
  const p = period.trim().toLowerCase();
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const start = new Date(now);
  if (p.endsWith("mo"))
    start.setMonth(start.getMonth() - Number(p.slice(0, -2) || 11));
  else if (p.endsWith("y"))
    start.setFullYear(start.getFullYear() - Number(p.slice(0, -1) || 1));
  else if (p.endsWith("d"))
    start.setDate(start.getDate() - Number(p.slice(0, -1) || 30));
  else start.setMonth(start.getMonth() - 11);
  const end = now;
  return { start: toIso(start), end: toIso(end) };
}
