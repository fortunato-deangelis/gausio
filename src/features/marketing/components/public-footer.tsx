import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/shared";

const PRODUCT_LINKS = [
  { label: "Funzionalità", href: "/#funzionalita" },
  { label: "Prezzi", href: "/#prezzi" },
  { label: "FAQ", href: "/#faq" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Termini e condizioni", href: "/termini-e-condizioni" },
  {
    label: "Dichiarazione di accessibilità",
    href: "/dichiarazione-di-accessibilita",
  },
  { label: "Preferenze cookie", href: "/preferenza-cookie" },
] as const;

/** Footer pubblico con colonne Prodotto / Legale / Contatti. */
export function PublicFooter() {
  return (
    <footer className="border-t bg-[#f5f5f7]">
      <div className="mx-auto grid w-full max-w-360 gap-12 px-5 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-20">
        <div className="flex flex-col gap-4">
          <BrandLogo showLabel imageClassName="bg-primary" />
          <p className="max-w-xs text-base leading-7 text-muted-foreground">
            Più ordine nel lavoro. Più spazio per far crescere la tua azienda.
          </p>
        </div>

        <nav aria-label="Prodotto" className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Prodotto</h2>
          {PRODUCT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legale" className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Legale</h2>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Contatti</h2>
          <p className="flex items-start gap-2 text-base leading-6 text-muted-foreground">
            <Mail aria-hidden className="size-4" /> info@gausio.com
          </p>
          <p className="flex items-start gap-2 text-base leading-6 text-muted-foreground">
            <Phone aria-hidden className="size-4" /> +39 06 1234 5678
          </p>
          <p className="flex items-start gap-2 text-base leading-6 text-muted-foreground">
            <MapPin aria-hidden className="size-4" /> Via dell&apos;Innovazione 42,
            00100 Roma
          </p>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-360 px-5 py-6 text-base text-muted-foreground sm:px-8">
          © 2026 Gausio S.r.l. — P.IVA 01234567890. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
}
