import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "success" | "warning" | "info" | "destructive";

const toneClasses: Record<StatTone, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  info: "bg-info/12 text-info",
  destructive: "bg-destructive/12 text-destructive",
};

type StatCardProps = Readonly<{
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  /** Variazione percentuale rispetto al periodo precedente. */
  trend?: { value: string; direction: "up" | "down" };
  hint?: string;
  className?: string;
}>;

/** KPI in stile Vuexy: icona tonale, valore grande, trend opzionale. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  trend,
  hint,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.direction === "up" ? "text-success" : "text-destructive"
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp aria-hidden className="size-3.5" />
              ) : (
                <TrendingDown aria-hidden className="size-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            toneClasses[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
