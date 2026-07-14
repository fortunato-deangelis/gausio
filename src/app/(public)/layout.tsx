import type { ReactNode } from "react";
import { PublicNavbar } from "@/features/marketing/components/public-navbar";
import { PublicFooter } from "@/features/marketing/components/public-footer";
import { CookieBanner } from "@/features/consent/components/cookie-banner";

/** Shell delle pagine pubbliche: navbar, contenuto, footer e cookie banner. */
export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <CookieBanner />
    </div>
  );
}
