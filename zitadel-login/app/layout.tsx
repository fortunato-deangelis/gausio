import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ZITADEL Login",
  description: "Self-hosted ZITADEL Login UI v2 (Gausio fork scaffold)",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <body>{children}</body>
    </html>
  );
}
