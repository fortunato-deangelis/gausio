import Image from "next/image";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared";
import { AuthCopyright } from "./auth-shell";

type AuthPageShellProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>;

/** Layout editoriale condiviso dai tre flussi di autenticazione. */
export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto grid min-h-dvh w-full max-w-360 grid-rows-[auto_1fr_auto] bg-white lg:grid-cols-2">
        <header className="col-span-full row-start-1 z-10 flex justify-center bg-transparent px-5 py-7 sm:px-8 lg:justify-start lg:px-12 lg:py-10">
          <BrandLogo
            showLabel
            imageClassName="size-12 bg-primary"
            labelClassName="text-3xl"
          />
        </header>

        <aside className="relative hidden overflow-hidden bg-[#f5f5f7] px-12 pb-12 pt-32 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:flex lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-xl">
            <p className="text-lg font-semibold text-primary">La tua azienda, insieme.</p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-balance xl:text-6xl">
              Le persone cambiano. Il contesto resta.
            </h2>
            <p className="mt-6 max-w-lg text-xl leading-relaxed text-muted-foreground">
              Entra in uno spazio condiviso dove clienti, attività e documenti
              continuano a parlare la stessa lingua.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4" aria-hidden>
              <div className="h-56 overflow-hidden rounded-[2px] bg-white p-4 ring-1 ring-black/8">
                <Image
                  src="/auth/team-alessia.svg"
                  alt=""
                  width={1744}
                  height={1744}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-10 h-56 overflow-hidden rounded-[2px] bg-primary/10 p-4 ring-1 ring-primary/15">
                <Image
                  src="/auth/team-marco.svg"
                  alt=""
                  width={1744}
                  height={1744}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="col-span-2 -mt-12 ml-auto h-44 w-[52%] overflow-hidden rounded-[2px] bg-white p-4 ring-1 ring-black/8">
                <Image
                  src="/auth/team-giulia.svg"
                  alt=""
                  width={1744}
                  height={1744}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="row-start-2 flex items-center justify-center px-5 py-10 sm:px-8 lg:col-start-2 lg:px-12 lg:py-16">
          <div className="w-full max-w-lg">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.04em] text-balance sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="mt-10">{children}</div>
          </div>
        </section>

        <footer className="row-start-3 px-5 py-7 sm:px-8 lg:col-start-2 lg:px-12">
          <AuthCopyright />
        </footer>
      </div>
    </main>
  );
}
