import Link from "next/link";
import { Hexagon, Mail, MapPin, Phone } from "lucide-react";
import { OpenBannerButton } from "@/features/consent/components/open-banner-button";

const PRODUCT_LINKS = [
  { label: "Funzionalità", href: "/#funzionalita" },
  { label: "Prezzi", href: "/#prezzi" },
  { label: "FAQ", href: "/#faq" },
  { label: "Accedi", href: "/sign-in" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Termini e condizioni", href: "/termini-e-condizioni" },
  {
    label: "Dichiarazione di accessibilità",
    href: "/dichiarazione-di-accessibilita",
  },
  { label: "Preferenze cookie", href: "/preferenze-cookie" },
] as const;

/** Footer pubblico con colonne Prodotto / Legale / Contatti. */
export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Hexagon aria-hidden className="size-6 fill-primary/20 text-primary" />
            <span>
              Gau<span className="text-primary">sio</span>
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Il gestionale all-in-one per clienti, ordini, fatture, magazzino,
            commesse, personale e qualità ISO.
          </p>
        </div>

        <nav aria-label="Prodotto" className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Prodotto</h2>
          {PRODUCT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legale" className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Legale</h2>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
          <OpenBannerButton />
        </nav>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Contatti</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail aria-hidden className="size-4" /> info@gausio.example
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone aria-hidden className="size-4" /> +39 06 1234 5678
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin aria-hidden className="size-4" /> Via dell&apos;Innovazione 42,
            00100 Roma
          </p>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-sm text-muted-foreground">
          © 2026 Gausio S.r.l. — P.IVA 01234567890. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
}
