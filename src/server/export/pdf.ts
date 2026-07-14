import "server-only";
import pdfmake from "pdfmake";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { ExportColumn } from "./xlsx";

/**
 * Generazione PDF lato server con pdfmake 0.3 e i font standard PDF
 * (Helvetica: nessun file font da imbarcare).
 */

const STANDARD_FONTS = [
  "Helvetica",
  "Helvetica-Bold",
  "Helvetica-Oblique",
  "Helvetica-BoldOblique",
];

pdfmake.setFonts({
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});
// Nessuna risorsa remota; su filesystem sono ammessi solo i nomi dei font
// standard PDF (PDFKit li risolve internamente, non da disco).
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((path) => STANDARD_FONTS.includes(path));

const BRAND = "#7367F0";

function render(definition: TDocumentDefinitions): Promise<Buffer> {
  return pdfmake
    .createPdf({
      defaultStyle: { font: "Helvetica", fontSize: 9 },
      pageMargins: [32, 48, 32, 48],
      ...definition,
    })
    .getBuffer();
}

function header(title: string, subtitle?: string): Content {
  return {
    stack: [
      { text: title, fontSize: 16, bold: true, color: BRAND },
      subtitle ? { text: subtitle, fontSize: 9, color: "#6D6B77" } : [],
      { text: "", margin: [0, 8, 0, 0] },
    ],
  };
}

/** PDF di elenco: tabella con tutte le righe. */
export async function buildListPdf<T>(options: {
  title: string;
  subtitle?: string;
  columns: readonly ExportColumn<T>[];
  rows: readonly T[];
  landscape?: boolean;
}): Promise<Buffer> {
  const { title, subtitle, columns, rows, landscape } = options;
  return render({
    pageOrientation: landscape ? "landscape" : "portrait",
    content: [
      header(title, subtitle),
      {
        table: {
          headerRows: 1,
          widths: columns.map(() => "auto"),
          body: [
            columns.map((c) => ({
              text: c.header,
              bold: true,
              color: "#FFFFFF",
              fillColor: BRAND,
            })),
            ...rows.map((row) =>
              columns.map((c) => ({ text: String(c.value(row) ?? "") }))
            ),
          ],
        },
        layout: {
          hLineColor: () => "#E4E2EA",
          vLineColor: () => "#E4E2EA",
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 6,
          paddingRight: () => 6,
        },
      },
    ],
    footer: (currentPage, pageCount) => ({
      text: `Pagina ${currentPage} di ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: "#6D6B77",
    }),
  });
}

export type DetailSection = Readonly<{
  title?: string;
  /** Coppie etichetta/valore. */
  fields?: readonly { label: string; value: string | null | undefined }[];
  /** Tabella opzionale (es. righe fattura). */
  table?: Readonly<{
    headers: readonly string[];
    rows: readonly (readonly (string | number | null | undefined)[])[];
  }>;
  /** Testo libero (es. note, contenuto procedura). */
  text?: string;
}>;

/** PDF di dettaglio: sezioni con campi, tabelle e testo. */
export async function buildDetailPdf(options: {
  title: string;
  subtitle?: string;
  sections: readonly DetailSection[];
}): Promise<Buffer> {
  const { title, subtitle, sections } = options;
  const content: Content[] = [header(title, subtitle)];

  for (const section of sections) {
    if (section.title) {
      content.push({
        text: section.title,
        bold: true,
        fontSize: 11,
        color: BRAND,
        margin: [0, 10, 0, 4],
      });
    }
    if (section.fields?.length) {
      content.push({
        columns: [
          {
            table: {
              widths: [130, "*"],
              body: section.fields.map((f) => [
                { text: f.label, bold: true, color: "#6D6B77" },
                { text: f.value ?? "—" },
              ]),
            },
            layout: "noBorders",
          },
        ],
      });
    }
    if (section.table) {
      content.push({
        margin: [0, 6, 0, 0],
        table: {
          headerRows: 1,
          widths: section.table.headers.map(() => "auto"),
          body: [
            section.table.headers.map((h) => ({
              text: h,
              bold: true,
              color: "#FFFFFF",
              fillColor: BRAND,
            })),
            ...section.table.rows.map((r) =>
              r.map((cell) => ({ text: String(cell ?? "") }))
            ),
          ],
        },
        layout: {
          hLineColor: () => "#E4E2EA",
          vLineColor: () => "#E4E2EA",
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 6,
          paddingRight: () => 6,
        },
      });
    }
    if (section.text) {
      content.push({ text: section.text, margin: [0, 6, 0, 0] });
    }
  }

  return render({ content });
}
