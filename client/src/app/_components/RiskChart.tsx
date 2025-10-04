"use client";

import type { LineChartProps } from "@/components/line-chart";
import dynamic from "next/dynamic";

const LineChart = dynamic<LineChartProps>(
  () => import("@/components/line-chart"),
  {
    ssr: false,
    loading: ({ height = 240 }) => (
      <div
        className="w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900/40"
        style={{ height }}
      />
    ),
  }
);

interface RiskChartProps {
  title?: string;
  series: LineChartProps["series"];
  height: number;
  className?: string;
}

export default function RiskChart({
  title,
  series,
  height,
  className,
}: RiskChartProps) {
  const containerClasses = `w-full ${className || ""}`.trim();

  return (
    <div className={containerClasses}>
      {title && <h3 className="font-semibold">{title}</h3>}
      <div className={title ? "mt-2 w-full" : "w-full"}>
        <LineChart series={series} height={height} />
      </div>
    </div>
  );
}