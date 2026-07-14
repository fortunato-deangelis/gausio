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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferenze cookie</h1>
        <p className="mt-2 text-muted-foreground">
          Qui puoi rivedere e modificare in ogni momento il consenso espresso
          per le categorie di cookie opzionali. Per i dettagli consulta la{" "}
          <Link
            href="/cookie-policy"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            Cookie Policy
          </Link>
          .
        </p>
      </div>
      <CookiePreferences />
    </div>
  );
}
