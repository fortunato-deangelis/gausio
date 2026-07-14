import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderProps = Readonly<{
  title: string;
  description?: string;
  /** Azioni (bottoni) allineate a destra. */
  actions?: ReactNode;
  /** Link "indietro" opzionale sopra il titolo. */
  backHref?: string;
  backLabel?: string;
  className?: string;
}>;

/** Intestazione standard delle pagine: titolo, descrizione e azioni. */
export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Indietro",
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {backHref && (
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit -ml-2 text-muted-foreground"
          )}
        >
          <ArrowLeft aria-hidden className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
