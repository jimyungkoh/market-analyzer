export type TimeSeriesPoint = {
  date: Date;
  value: number;
};

export function calculateSMA(
  data: TimeSeriesPoint[],
  windowSize: number
): TimeSeriesPoint[] {
  if (windowSize <= 0) throw new Error("windowSize must be > 0");
  if (data.length < windowSize) return [];

  const result: TimeSeriesPoint[] = [];
  let rollingSum = 0;

  for (let i = 0; i < data.length; i++) {
    rollingSum += data[i].value;
    if (i >= windowSize) {
      rollingSum -= data[i - windowSize].value;
    }

    if (i >= windowSize - 1) {
      result.push({ date: data[i].date, value: rollingSum / windowSize });
    }
  }

  return result;
}

export function slopeLast(
  series: TimeSeriesPoint[],
  lookback: number = 5
): number {
  const n = Math.min(Math.max(lookback, 2), series.length);
  if (n < 2) return 0;

  // Linear regression slope over the last n points (x = 0..n-1)
  const startIndex = series.length - n;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = series[startIndex + i].value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

export function momentumDirection(
  series: TimeSeriesPoint[],
  lookback: number = 5
): "up" | "down" | "flat" {
  const s = slopeLast(series, lookback);
  if (s > 0) return "up";
  if (s < 0) return "down";
  return "flat";
}
