"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  AppCard,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shared";
import type { MonthlyRevenuePoint } from "../queries";

const chartConfig = {
  emesso: { label: "Fatturato emesso", color: "var(--chart-1)" },
  ricevuto: { label: "Fatturato ricevuto", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Andamento fatturato ultimi 12 mesi (emesso vs ricevuto). */
export function RevenueChart({
  data,
}: Readonly<{ data: MonthlyRevenuePoint[] }>) {
  return (
    <AppCard
      title="Andamento fatturato"
      description="Fatture emesse e ricevute negli ultimi 12 mesi"
    >
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <AreaChart data={data} margin={{ left: 8, right: 8 }}>
          <defs>
            <linearGradient id="fillEmesso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillRicevuto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value: number) =>
              Intl.NumberFormat("it-IT", {
                notation: "compact",
                style: "currency",
                currency: "EUR",
              }).format(value)
            }
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="emesso"
            type="monotone"
            fill="url(#fillEmesso)"
            stroke="var(--chart-1)"
            strokeWidth={2}
          />
          <Area
            dataKey="ricevuto"
            type="monotone"
            fill="url(#fillRicevuto)"
            stroke="var(--chart-2)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </AppCard>
  );
}
