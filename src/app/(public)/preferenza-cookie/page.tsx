import type { Metadata } from "next";
import Link from "next/link";
import { CookiePreferences } from "@/features/consent/components/cookie-preferences";

export const metadata: Metadata = {
  title: "Preferenze cookie",
  description:
    "Gestisci il consenso all'uso dei cookie opzionali su Gausio.",
};

export default function CookiePreferencesPage() {
  return (
    <section className="bg-[#f5f5f7] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-360">
        <header className="max-w-5xl pb-12 sm:pb-16">
          <p className="text-lg font-semibold text-primary sm:text-xl">
            Informazioni legali
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            Preferenze cookie
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
            Qui puoi rivedere e modificare in ogni momento il consenso espresso
            per le categorie di cookie opzionali. Per maggiori informazioni
            consulta la{" "}
            <Link
              href="/cookie-policy"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </header>
        <CookiePreferences />
      </div>
    </section>
  );
}
