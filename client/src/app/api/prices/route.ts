import {
  computeStartEndByPeriod,
  getLatestDateForPrices,
  queryPricesRange,
  upsertPricesFromPythonJSON,
} from "@/lib/db-helpers";
import { spawnPythonScript } from "@/lib/runPythonScript";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tickers = (searchParams.get("tickers") || "SPY,TIP").toUpperCase();
  const period = searchParams.get("period") || "11mo";
  const interval = searchParams.get("interval") || "1d";
  const symbols = tickers
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const { start, end } = computeStartEndByPeriod(period);

  // 1) 커버리지/스테일 확인
  const latestMap = await getLatestDateForPrices(symbols, interval);
  const needFetch = symbols.some((s) => {
    const latest = latestMap[s];
    return !latest || latest < end; // 최신 저장일이 오늘 기준 end보다 뒤따르지 못하면 수집
  });

  // 2) 필요 시에만 Python 실행 후 업서트
  if (needFetch) {
    const child = spawnPythonScript("fetch_prices.py", [
      "--tickers",
      tickers,
      "--period",
      period,
      "--interval",
      interval,
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: unknown) => (stdout += String(d)));
    child.stderr.on("data", (d: unknown) => (stderr += String(d)));
    child.on("error", (err: unknown) => {
      stderr += err instanceof Error ? err.message : String(err);
    });

    const exitCode: number = await new Promise((resolve) => {
      child.on("close", resolve);
    });

    console.log(`[API] prices - exitCode: ${exitCode}`);
    if (exitCode !== 0) {
      return new Response(
        JSON.stringify({
          error: true,
          message: stderr || "fetch_prices failed",
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(stdout);
    } catch {
      return new Response(
        JSON.stringify({ error: true, message: "invalid python json" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
    await upsertPricesFromPythonJSON(payload, interval);
  }

  // 3) DB에서 조회 후 반환
  const data = await queryPricesRange(symbols, start, end, interval);
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}
