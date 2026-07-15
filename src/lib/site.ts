import type { Metadata } from "next";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gausio.com";

export const siteUrl = new URL("/", configuredSiteUrl);

export const siteConfig = {
  name: "Gausio",
  legalName: "Gausio S.r.l.",
  title: "Gausio — La tua azienda. Tutto torna.",
  description:
    "Gausio riunisce clienti, ordini, attività e documenti in un unico flusso, così il team lavora con più chiarezza e l’azienda torna ad avanzare.",
  locale: "it_IT",
  language: "it-IT",
  ogImage: {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "Gausio: La tua azienda. Tutto torna. Anteprima del gestionale.",
  },
} as const;

type PublicPageMetadataOptions = Readonly<{
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}>;

/** Metadata completi e coerenti per una singola pagina pubblica. */
export function createPublicPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PublicPageMetadataOptions): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
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
      title: socialTitle,
      description,
      images: [siteConfig.ogImage.url],
    },
  };
}
