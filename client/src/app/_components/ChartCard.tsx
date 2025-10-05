"use client";

import type { LineChartProps } from "@/components/line-chart";
import clsx from "clsx";
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

interface ChartCardProps {
  title?: string;
  series: LineChartProps["series"];
  height: number;
  className?: string;
}

export default function ChartCard({
  title,
  series,
  height,
  className,
}: ChartCardProps) {
  return (
    <div
      className={clsx(
        "w-full bg-white dark:bg-gray-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
          {title}
        </h3>
      )}
      <div className={clsx("w-full", { "mt-2": title })}>
        <LineChart series={series} height={height} />
      </div>
    </div>
  );
}
