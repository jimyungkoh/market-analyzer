// Simple backfill runner: call local API to populate SQLite cache
// Pre-req: dev server running at http://localhost:3000 and Python deps ready

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const urls = [
    `${BASE}/api/prices?tickers=SPY,TIP&period=10y&interval=1d`,
    `${BASE}/api/spy-dividend-yield?period=5y`,
  ];
  for (const url of urls) {
    
    console.log(`[backfill] GET ${url}`);
    const res = await fetch(url, { headers: { "cache-control": "no-store" } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed ${res.status}: ${text}`);
    }
    // drain body to ensure full completion
    await res.json().catch(() => null);
  }
  
  console.log("[backfill] done");
}

main().catch((err) => {
  
  console.error("[backfill] error", err);
  process.exit(1);
});
