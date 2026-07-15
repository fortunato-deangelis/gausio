import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
    },
  },
};

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
