"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  BrandLogo,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  buttonVariants,
} from "@/components/shared";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Funzionalità", href: "/#funzionalita" },
  { label: "Prezzi", href: "/#prezzi" },
  { label: "FAQ", href: "/#faq" },
] as const;

/** Navbar pubblica sticky in stile Vuexy, con menu mobile a Sheet. */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    const syncScroll = () => setIsScrolled(window.scrollY > 0);

    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncScroll);
  }, []);

  const isActive = (href: (typeof NAV_LINKS)[number]["href"]) => {
    const [linkPathname, linkHash = ""] = href.split("#");
    return pathname === linkPathname && hash === (linkHash ? `#${linkHash}` : "");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        isScrolled
          ? "bg-background"
          : "bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60"
      )}
    >
      <div className="mx-auto flex h-20 max-h-20 w-full max-w-360 items-center gap-4 px-4 sm:px-6 md:gap-10 lg:px-8">
        <BrandLogo
          showLabel
          imageClassName="size-12 bg-primary"
        />

        <nav
          aria-label="Navigazione principale"
          className="hidden flex-1 md:block"
        >
          <ul className="flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "inline-flex h-12 items-center border-b-2 px-1 text-lg font-medium transition-colors",
                    isActive(link.href)
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Link
            href="/contatti"
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden md:inline-flex"
            )}
          >
            Richiedi una demo
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
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLogo showLabel imageClassName="size-12 bg-primary" />
                  <span className="sr-only">Menu</span>
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigazione mobile" className="px-4">
                <ul className="flex flex-col gap-2">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={cn(
                          "inline-flex h-12 items-center border-b-2 px-1 text-lg font-medium transition-colors",
                          isActive(link.href)
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Link
                  href="/contatti"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ size: "lg" })}
                >
                  Richiedi una demo
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
