import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared";

/** Shell minimale e centrata per le pagine di autenticazione/onboarding. */
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-primary/10 via-background to-background"
      />
      <BrandLogo className="mb-8" imageClassName="size-14" />
      {children}
    </div>
  );
}
