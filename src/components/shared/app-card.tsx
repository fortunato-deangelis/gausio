import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AppCardProps = Readonly<{
  title?: ReactNode;
  description?: ReactNode;
  /** Azioni mostrate in alto a destra nell'header. */
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

/** Wrapper standard della Card shadcn: header/azioni/footer opzionali. */
export function AppCard({
  title,
  description,
  actions,
  footer,
  children,
  className,
  contentClassName,
}: AppCardProps) {
  return (
    <Card className={className}>
      {(title || description || actions) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {actions && <CardAction>{actions}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
