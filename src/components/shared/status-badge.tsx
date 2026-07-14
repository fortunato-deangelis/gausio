import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "muted";

const toneClasses: Record<StatusTone, string> = {
  default: "bg-primary/12 text-primary border-transparent",
  success: "bg-success/12 text-success border-transparent",
  warning: "bg-warning/15 text-warning border-transparent",
  info: "bg-info/12 text-info border-transparent",
  destructive: "bg-destructive/12 text-destructive border-transparent",
  muted: "bg-muted text-muted-foreground border-transparent",
};

type StatusBadgeProps = Readonly<{
  label: string;
  tone?: StatusTone;
  className?: string;
}>;

/** Badge tonale in stile Vuexy per stati di documenti/entità. */
export function StatusBadge({
  label,
  tone = "default",
  className,
}: StatusBadgeProps) {
  return (
    <Badge className={cn(toneClasses[tone], "font-medium", className)}>
      {label}
    </Badge>
  );
}
