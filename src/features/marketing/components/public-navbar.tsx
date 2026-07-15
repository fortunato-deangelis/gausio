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
import {
  PUBLIC_PRODUCT_LINKS,
  type PublicSectionId,
} from "@/features/marketing/public-navigation";
import { cn } from "@/lib/utils";

const PUBLIC_SECTION_IDS = new Set<PublicSectionId>(
  PUBLIC_PRODUCT_LINKS.map((link) => link.id)
);

function getLastValidSectionId(hash: string): PublicSectionId | null {
  const candidates = hash
    .replace(/^#/, "")
    .split("#")
    .map((candidate) => {
      try {
        return decodeURIComponent(candidate);
      } catch {
        return candidate;
      }
    });

  return (
    candidates.findLast((candidate) =>
      PUBLIC_SECTION_IDS.has(candidate as PublicSectionId)
    ) as PublicSectionId | undefined
  ) ?? null;
}

/** Navbar pubblica sticky in stile Vuexy, con menu mobile a Sheet. */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<PublicSectionId | null>(
    null
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = PUBLIC_PRODUCT_LINKS.map((link) => ({
      id: link.id,
      element: document.getElementById(link.id),
    })).filter(
      (section): section is { id: PublicSectionId; element: HTMLElement } =>
        section.element !== null
    );

    const setUrlHash = (sectionId: PublicSectionId | null) => {
      const nextHash = sectionId ? `#${sectionId}` : "";
      if (window.location.hash === nextHash) return;

      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}${nextHash}`
      );
    };

    const syncActiveSection = () => {
      const activationLine =
        window.scrollY + 80 + Math.min(window.innerHeight * 0.2, 160);
      let currentSection: PublicSectionId | null = null;

      for (const section of sections) {
        if (section.element.offsetTop <= activationLine) {
          currentSection = section.id;
        } else {
          break;
        }
      }

      setActiveSection(currentSection);
      setUrlHash(currentSection);
    };

    const normalizeLocationHash = () => {
      if (!window.location.hash) return null;

      const sectionId = getLastValidSectionId(window.location.hash);
      setUrlHash(sectionId);
      return sectionId;
    };

    const syncLocation = () => {
      const sectionId = normalizeLocationHash();
      if (sectionId) {
        document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
      }
      window.requestAnimationFrame(syncActiveSection);
    };

    const initialSection = normalizeLocationHash();
    if (initialSection) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(initialSection)
          ?.scrollIntoView({ block: "start" });
        syncActiveSection();
      });
    } else {
      window.requestAnimationFrame(syncActiveSection);
    }

    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    window.addEventListener("hashchange", syncLocation);
    window.addEventListener("popstate", syncLocation);

    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
      window.removeEventListener("hashchange", syncLocation);
      window.removeEventListener("popstate", syncLocation);
    };
  }, [pathname]);

  useEffect(() => {
    const syncScroll = () => setIsScrolled(window.scrollY > 0);

    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncScroll);
  }, []);

  const isActive = (sectionId: PublicSectionId) =>
    pathname === "/" && activeSection === sectionId;

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: PublicSectionId
  ) => {
    setOpen(false);
    if (pathname !== "/") return;

    event.preventDefault();
    const nextHash = `#${sectionId}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;

    if (window.location.hash === nextHash) {
      window.history.replaceState(window.history.state, "", nextUrl);
    } else {
      window.history.pushState(window.history.state, "", nextUrl);
    }

    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
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
          className="hidden flex-1 xl:block"
        >
          <ul className="flex items-center gap-5">
            {PUBLIC_PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(event) => handleSectionClick(event, link.id)}
                  aria-current={isActive(link.id) ? "location" : undefined}
                  className={cn(
                    "inline-flex h-12 items-center border-b-2 px-1 text-lg font-medium transition-colors",
                    isActive(link.id)
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
          <a
            href="mailto:info@gausio.com"
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden xl:inline-flex"
            )}
          >
            Richiedi una demo
          </a>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                className="xl:hidden"
                aria-label="Apri il menu"
              >
                <Menu className="h-6! w-6!" />
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
                  {PUBLIC_PRODUCT_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={(event) => handleSectionClick(event, link.id)}
                        aria-current={
                          isActive(link.id) ? "location" : undefined
                        }
                        className={cn(
                          "inline-flex h-12 items-center border-b-2 px-1 text-lg font-medium transition-colors",
                          isActive(link.id)
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
                <a
                  href="mailto:info@gausio.com"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ size: "lg" })}
                >
                  Richiedi una demo
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
