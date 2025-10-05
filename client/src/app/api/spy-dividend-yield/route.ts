import {
  computeStartEndByPeriod,
  getLatestDateForDividend,
  queryDividendYieldRange,
  upsertDividendYieldFromPythonJSON,
} from "@/lib/db-helpers";
import { spawnPythonScript } from "@/lib/runPythonScript";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "11mo";
  const source = searchParams.get("source") || "spy"; // spy
  const symbol = "SPY";
  const { start, end } = computeStartEndByPeriod(period);
  const latest = await getLatestDateForDividend(symbol);
  const needFetch = !latest || latest < end;

  if (needFetch) {
    const child = spawnPythonScript("fetch_dividend_yield.py", [
      "--period",
      period,
      "--source",
      source,
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d: unknown) => (stdout += String(d)));
    child.stderr?.on("data", (d: unknown) => (stderr += String(d)));
    child.on("error", (err: unknown) => {
      stderr += err instanceof Error ? err.message : String(err);
    });

    const exitCode: number = await new Promise((resolve) => {
      child.on("close", resolve);
    });

    console.log(`[API] spy-dividend-yield - exitCode: ${exitCode}`);
    if (exitCode !== 0) {
      return new Response(
        JSON.stringify({
          error: true,
          message: stderr || "fetch_dividend_yield failed",
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
    await upsertDividendYieldFromPythonJSON(payload);
  }

  const data = await queryDividendYieldRange(symbol, start, end);
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}
