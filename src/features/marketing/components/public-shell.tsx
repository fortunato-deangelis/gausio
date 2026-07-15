import type { ReactNode } from "react";
import { CookieBanner } from "@/features/consent/components/cookie-banner";
import { PublicFooter } from "./public-footer";
import { PublicNavbar } from "./public-navbar";

type PublicShellProps = Readonly<{
  children: ReactNode;
}>;

/** Shell condivisa dal route group pubblico e dalla 404 globale. */
export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <CookieBanner />
    </div>
  );
}
