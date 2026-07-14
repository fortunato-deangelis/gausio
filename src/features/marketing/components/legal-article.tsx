import type { ReactNode } from "react";

type LegalArticleProps = Readonly<{
  title: string;
  lastUpdated: string;
  children: ReactNode;
}>;

/**
 * Contenitore tipografico per le pagine legali: applica stili coerenti a
 * titoli, paragrafi, liste e tabelle senza dipendere da plugin typography.
 */
export function LegalArticle({
  title,
  lastUpdated,
  children,
}: LegalArticleProps) {
  return (
    <article
      className={[
        "mx-auto w-full max-w-3xl px-4 py-12",
        "[&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
        "[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_p]:mt-3 [&_p]:text-[0.95rem] [&_p]:leading-7 [&_p]:text-muted-foreground",
        "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[0.95rem] [&_ul]:leading-7 [&_ul]:text-muted-foreground",
        "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-[0.95rem] [&_ol]:leading-7 [&_ol]:text-muted-foreground",
        "[&_li]:mt-1",
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary",
        "[&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-muted-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
      ].join(" ")}
    >
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ultimo aggiornamento: {lastUpdated}
      </p>
      {children}
    </article>
  );
}
