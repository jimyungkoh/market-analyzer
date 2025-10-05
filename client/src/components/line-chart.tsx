import { TimeSeriesPoint } from "@/lib/indicators";
import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type Series = {
  name: string;
  color?: string;
  data: TimeSeriesPoint[];
};

export type LineChartProps = {
  series: Series[];
  height?: number;
  strokeWidth?: number;
};

type MergedRow = { date: number } & Record<string, number | undefined>;

export default function LineChart({
  series,
  height = 240,
  strokeWidth = 2,
}: LineChartProps) {
  const allPoints = series.flatMap((s) => s.data);
  if (allPoints.length === 0) return null;

  const defaultPalette = [
    "#1773cf",
    "#16a34a",
    "#ef4444",
    "#f59e0b",
    "#06b6d4",
    "#a855f7",
  ];

  // Merge series into a unified dataset keyed by timestamp
  const timestampToRow = new Map<number, MergedRow>();
  for (const s of series) {
    for (const p of s.data) {
      const t =
        p.date instanceof Date ? p.date.getTime() : new Date(p.date).getTime();
      let row = timestampToRow.get(t);
      if (!row) {
        row = { date: t };
        timestampToRow.set(t, row);
      }
      row[s.name] = p.value;
    }
  }

  const data: MergedRow[] = Array.from(timestampToRow.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, row]) => row);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            {series.map((s, idx) => {
              const color =
                s.color || defaultPalette[idx % defaultPalette.length];
              return (
                <linearGradient
                  key={s.name}
                  id={`gradient-${s.name}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <XAxis hide dataKey="date" type="number" domain={["dataMin", "dataMax"]} />
          <YAxis hide domain={["dataMin", "auto"]} />
          {series.map((s, idx) => (
            <Area
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color || defaultPalette[idx % defaultPalette.length]}
              fill={`url(#gradient-${s.name})`}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}