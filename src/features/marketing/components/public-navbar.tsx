"use client";

import { useState } from "react";
import Link from "next/link";
import { Hexagon, Menu } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ThemeToggle,
  buttonVariants,
} from "@/components/shared";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Funzionalità", href: "/#funzionalita" },
  { label: "Prezzi", href: "/#prezzi" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contatti", href: "/contatti" },
] as const;

export function BrandLogo({ className }: Readonly<{ className?: string }>) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 text-lg font-bold tracking-tight",
        className
      )}
    >
      <Hexagon aria-hidden className="size-6 fill-primary/20 text-primary" />
      <span>
        Gau<span className="text-primary">sio</span>
      </span>
    </Link>
  );
}

/** Navbar pubblica sticky in stile Vuexy, con menu mobile a Sheet. */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <BrandLogo />

        <nav aria-label="Navigazione principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-sm font-medium text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden sm:inline-flex"
            )}
          >
            Accedi
          </Link>
          <Link href="/sign-in" className={cn(buttonVariants(), "hidden sm:inline-flex")}>
            Inizia gratis
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Apri il menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigazione mobile" className="px-4">
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Accedi
                </Link>
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className={buttonVariants()}
                >
                  Inizia gratis
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
