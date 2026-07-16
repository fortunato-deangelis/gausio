import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const privatePaths = [
  "/app",
  "/api",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/onboarding",
  "/invito",
  "/preferenze-cookie",
];

/** Consente il crawl del sito istituzionale ed esclude app, API e autenticazione. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/apple-icon.png"],
      disallow: privatePaths,
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
