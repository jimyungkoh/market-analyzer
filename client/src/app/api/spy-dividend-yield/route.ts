import { spawnPythonScript } from "@/lib/runPythonScript";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "11mo";
  const source = searchParams.get("source") || "spy"; // spy

  // FRED에서 제공하는 S&P 500 배당수익률 시계열 반환
  const child = spawnPythonScript("fetch_dividend_yield.py", [
    "--period",
    period,
    "--source",
    source,
  ]);

  let stdout = "";
  let stderr = "";

  child.stdout?.on("data", (d) => (stdout += d.toString()));
  child.stderr?.on("data", (d) => (stderr += d.toString()));
  child.on("error", (err) => {
    stderr += err.message;
  });

  const exitCode: number = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  console.log(`[API] spy-dividend-yield - exitCode: ${exitCode}`);
  console.log(`[API] spy-dividend-yield - stdout: ${stdout}`);
  console.log(`[API] spy-dividend-yield - stderr: ${stderr}`);

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

  return new Response(stdout, {
    headers: { "content-type": "application/json" },
  });
}
