"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportMenuProps = Readonly<{
  /** URL del route handler di export PDF (elenco o dettaglio). */
  pdfUrl?: string;
  /** URL del route handler di export XLSX. */
  xlsxUrl?: string;
  label?: string;
}>;

/** Menu "Esporta" standard: apre i route handler di export in download. */
export function ExportMenu({ pdfUrl, xlsxUrl, label = "Esporta" }: ExportMenuProps) {
  if (!pdfUrl && !xlsxUrl) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download aria-hidden className="size-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {pdfUrl && (
          <DropdownMenuItem asChild>
            <a href={pdfUrl} download>
              <FileText aria-hidden className="size-4" />
              PDF
            </a>
          </DropdownMenuItem>
        )}
        {xlsxUrl && (
          <DropdownMenuItem asChild>
            <a href={xlsxUrl} download>
              <FileSpreadsheet aria-hidden className="size-4" />
              Excel (XLSX)
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
