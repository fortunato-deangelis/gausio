import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared";
import { siteConfig } from "@/lib/site";

export function AuthCopyright({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <p className={`text-center text-sm text-muted-foreground ${className}`}>
      © 2026 {siteConfig.legalName}. Tutti i diritti riservati.
    </p>
  );
}

/** Shell centrata per onboarding e inviti, coerente con la home. */
export function CenteredAuthShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh bg-[#f5f5f7]">
      <div className="mx-auto grid min-h-dvh w-full max-w-360 grid-rows-[auto_1fr_auto]">
        <header className="flex justify-start bg-transparent px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <BrandLogo
            showLabel
            imageClassName="size-12 bg-primary"
            labelClassName="text-3xl"
          />
        </header>
        <div className="flex items-center justify-center px-5 py-6 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </div>
        <footer className="px-5 py-7 sm:px-8 lg:px-12">
          <AuthCopyright />
        </footer>
      </div>
    </div>
  );
}
