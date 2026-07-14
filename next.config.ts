import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Librerie server con require dinamici/asset interni: non vanno bundlate
  // (pdfmake in particolare rompe il resolver dei font se impacchettato).
  serverExternalPackages: ["pdfmake", "exceljs", "pg"],
};

export default nextConfig;
