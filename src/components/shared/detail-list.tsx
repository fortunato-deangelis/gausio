import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailListProps = Readonly<{
  items: readonly {
    label: string;
    value: ReactNode;
  }[];
  columns?: 1 | 2 | 3;
  className?: string;
}>;

/** Elenco etichetta/valore per le pagine di dettaglio. */
export function DetailList({ items, columns = 2, className }: DetailListProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-8 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
