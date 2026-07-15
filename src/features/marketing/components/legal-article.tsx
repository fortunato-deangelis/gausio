import type { ReactNode } from "react";

type LegalArticleProps = Readonly<{
  title: string;
  lastUpdated: string;
  children: ReactNode;
}>;

/**
 * Layout editoriale condiviso per le pagine legali pubbliche.
 */
export function LegalArticle({
  title,
  lastUpdated,
  children,
}: LegalArticleProps) {
  return (
    <section className="bg-[#f5f5f7] px-5 py-20 sm:px-8 sm:py-28">
      <article className="mx-auto w-full max-w-360">
        <header className="max-w-5xl pb-12 sm:pb-16">
          <p className="text-lg font-semibold text-primary sm:text-xl">
            Informazioni legali
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            {title}
          </h1>
          <p className="mt-5 text-base text-muted-foreground">
            Ultimo aggiornamento: {lastUpdated}
          </p>
        </header>

        <div
          className={[
            "rounded-[2px] bg-white p-6 sm:p-10 lg:p-14",
            "[&_h2]:mt-14 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] sm:[&_h2]:text-4xl",
            "[&_h3]:mt-9 [&_h3]:text-xl [&_h3]:font-semibold",
            "[&_p]:mt-4 [&_p]:text-base [&_p]:leading-8 [&_p]:text-muted-foreground",
            "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-base [&_ul]:leading-8 [&_ul]:text-muted-foreground",
            "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-base [&_ol]:leading-8 [&_ol]:text-muted-foreground",
            "[&_li]:mt-2",
            "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary",
            "[&_table]:mt-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-base",
            "[&_th]:border [&_th]:bg-muted [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:text-muted-foreground",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
          ].join(" ")}
        >
          {children}
        </div>
      </article>
    </section>
  );
}
