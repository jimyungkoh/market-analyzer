import { TimeSeriesPoint } from "@/lib/indicators";
import React from "react";
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
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
    "#2563eb", // blue-600
    "#16a34a", // green-600
    "#ef4444", // red-500
    "#f59e0b", // amber-500
    "#06b6d4", // cyan-500
    "#a855f7", // violet-500
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
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 30, left: 32 }}
        >
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts) =>
              new Date(Number(ts)).toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric",
              })
            }
            tick={{ fill: "#52525b", fontSize: 12 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fill: "#52525b", fontSize: 12 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
            width={40}
          />
          <Tooltip
            labelFormatter={(ts) =>
              new Date(Number(ts)).toLocaleString("ko-KR")
            }
          />
          <Legend />
          {series.map((s, idx) => {
            const color =
              s.color || defaultPalette[idx % defaultPalette.length];
            return (
              <React.Fragment key={s.name}>
                <Line
                  key={`${s.name}-line`}
                  type="monotone"
                  dataKey={s.name}
                  dot={false}
                  isAnimationActive={false}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  connectNulls
                />
                {idx === 0 && (
                  <Area
                    key={`${s.name}-area`}
                    type="monotone"
                    dataKey={s.name}
                    fill={color}
                    fillOpacity={0.3}
                    stroke={color}
                    strokeWidth={0}
                    connectNulls
                  />
                )}
              </React.Fragment>
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
