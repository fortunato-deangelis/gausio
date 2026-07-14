import type { ReactNode } from "react";
import Link from "next/link";
import { Hexagon } from "lucide-react";

/** Shell minimale e centrata per le pagine di autenticazione/onboarding. */
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background"
      />
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight"
      >
        <Hexagon aria-hidden className="size-7 fill-primary/20 text-primary" />
        <span>
          Gau<span className="text-primary">sio</span>
        </span>
      </Link>
      {children}
    </div>
  );
}
