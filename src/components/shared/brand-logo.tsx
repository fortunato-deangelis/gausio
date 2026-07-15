import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = Readonly<{
  className?: string;
  imageClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
}>;

/** Marchio Gausio condiviso, collegato alla home pubblica. */
export function BrandLogo({
  className,
  imageClassName,
  labelClassName,
  showLabel = false,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Gausio — Vai alla home"
      className={cn(
        "inline-flex shrink-0 items-center",
        showLabel && "gap-1",
        className
      )}
    >
      <span
        aria-hidden
        style={{
          maskImage: "url('/g.svg')",
          maskPosition: "center",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskImage: "url('/g.svg')",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
        }}
        className={cn(
          "block size-10 bg-foreground",
          imageClassName
        )}
      />
      {showLabel && (
        <span
          className={cn(
            "text-3xl font-bold tracking-tight text-primary",
            labelClassName
          )}
        >
          Gausio
        </span>
      )}
    </Link>
  );
}
