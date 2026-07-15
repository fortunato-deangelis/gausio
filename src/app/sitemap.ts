import type { MetadataRoute } from "next";
import { siteConfig, siteUrl } from "@/lib/site";

const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.4 },
  {
    path: "/termini-e-condizioni",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/dichiarazione-di-accessibilita",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/preferenza-cookie",
    changeFrequency: "monthly",
    priority: 0.2,
  },
] as const;

/** Pubblica esclusivamente le rotte canoniche del sito istituzionale. */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
    ...(path === "/"
      ? { images: [new URL(siteConfig.ogImage.url, siteUrl).toString()] }
      : {}),
  }));
}
