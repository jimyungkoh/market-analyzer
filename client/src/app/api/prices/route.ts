import { NextRequest } from "next/server";
import { spawnPythonScript } from "@/lib/runPythonScript";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tickers = (searchParams.get("tickers") || "SPY,TIP").toUpperCase();
  const period = searchParams.get("period") || "11mo";
  const interval = searchParams.get("interval") || "1d";

  // 기본값은 docker compose scripts 서비스에서 실행하며, SCRIPTS_RUNTIME=python 설정 시 호스트 Python을 사용합니다.
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

  child.stdout.on("data", (d) => (stdout += d.toString()));
  child.stderr.on("data", (d) => (stderr += d.toString()));
  child.on("error", (err) => {
    stderr += err.message;
  });

  const exitCode: number = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  console.log(`[API] prices - exitCode: ${exitCode}`);
  console.log(`[API] prices - stdout: ${stdout}`);
  console.log(`[API] prices - stderr: ${stderr}`);

  if (exitCode !== 0) {
    return new Response(
      JSON.stringify({ error: true, message: stderr || "fetch_prices failed" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }

  return new Response(stdout, {
    headers: { "content-type": "application/json" },
  });
}
