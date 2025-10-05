import { TimeSeriesPoint } from "./indicators";

export function generateMockDailySeries(
  symbol: string,
  months: number,
  startPrice: number = 100
): TimeSeriesPoint[] {
  const totalDays = Math.max(10, Math.round(months * 30));
  const today = new Date();
  const points: TimeSeriesPoint[] = [];
  let price = startPrice;

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    // Simple random walk with a bit of seasonality
    const seasonal = Math.sin((i / 20) * Math.PI) * 0.6;
    const noise = (Math.random() - 0.5) * 1.2;
    price = Math.max(1, price + seasonal + noise);

    points.push({ date: d, value: Number(price.toFixed(2)) });
  }

  return points;
}

export function generateMockMonthlyYieldSeries(
  months: number,
  base: number = 1.45
): TimeSeriesPoint[] {
  const today = new Date();
  const points: TimeSeriesPoint[] = [];
  let value = base;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(today.getMonth() - i);

    const seasonal = Math.sin((i / 3) * Math.PI) * 0.15;
    const noise = (Math.random() - 0.5) * 0.08;
    value = Math.max(0.4, base + seasonal + noise);

    points.push({ date: d, value: Number(value.toFixed(2)) });
  }

  return points;
}

