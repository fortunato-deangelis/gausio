import { redirect } from "next/navigation";

/** Alias storico mantenuto per i collegamenti già condivisi. */
export default function LegacyCookiePreferencesPage() {
  redirect("/preferenza-cookie");
}
