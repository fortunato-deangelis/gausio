import type { ReactNode } from "react";

type PublicStatusPageProps = Readonly<{
  eyebrow: string;
  title: ReactNode;
  description: string;
  code: string;
  actions: ReactNode;
}>;

/** Stato editoriale per 404 ed errori pubblici, coerente con la landing. */
export function PublicStatusPage({
  eyebrow,
  title,
  description,
  code,
  actions,
}: PublicStatusPageProps) {
  return (
    <section className="overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
      <div className="mx-auto grid min-h-[60dvh] w-full max-w-360 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <div className="max-w-3xl">
          <p className="text-lg font-semibold text-primary sm:text-xl">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            {description}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">{actions}</div>
        </div>

        <div
          aria-hidden
          className="flex min-h-72 items-center justify-center overflow-hidden rounded-[2px] bg-[#f5f5f7] px-6 py-12 sm:min-h-[30rem]"
        >
          <span className="text-[clamp(8rem,22vw,21rem)] font-bold leading-none tracking-[-0.09em] text-black/[0.07]">
            {code}
          </span>
        </div>
      </div>
    </section>
  );
}
