import type { Metadata } from "next";
import { Geist, Noto_Serif_Georgian, Geist_Mono } from "next/font/google";
import { Toaster, TooltipProvider } from "@/components/shared";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Noto_Serif_Georgian({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Gausio — Il gestionale per la tua azienda",
    template: "%s · Gausio",
  },
  description:
    "Gestionale aziendale completo: clienti e fornitori, ordini, fatture, DDT, magazzino, commesse, personale e documentazione ISO.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
