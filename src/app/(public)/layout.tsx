import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicShell } from "@/features/marketing/components/public-shell";
import { siteConfig, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "gestionale aziendale",
    "software gestionale",
    "ERP italiano",
    "gestione clienti",
    "gestione ordini",
    "gestione attività",
    "gestione documenti",
    "Gausio",
  ],
  authors: [{ name: siteConfig.legalName, url: "/" }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  category: "Software gestionale aziendale",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    images: [
      {
        ...siteConfig.ogImage,
        type: "image/png",
      },
    ],
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage.url],
  },
};

/** Shell delle pagine pubbliche: navbar, contenuto, footer e cookie banner. */
export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <PublicShell>{children}</PublicShell>;
}
