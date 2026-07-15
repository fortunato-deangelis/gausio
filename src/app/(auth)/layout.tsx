import type { Metadata } from "next";
import type { ReactNode } from "react";

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

/** Boundary metadata delle rotte auth; ogni flusso compone la propria shell. */
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
