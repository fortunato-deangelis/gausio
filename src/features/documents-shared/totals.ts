/**
 * Calcolo totali documento (ordini/fatture). Usato sia dall'editor righe
 * lato client sia dalle server action: i totali vengono SEMPRE ricalcolati
 * lato server, mai accettati dal client.
 */

export type LineLike = Readonly<{
  quantity: string | number;
  unitPrice: string | number;
  vatRate: string | number;
  discount?: string | number | null;
}>;

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Totale riga: quantità × prezzo × (1 − sconto%). */
export function computeLineTotal(line: LineLike): number {
  const qty = toNumber(line.quantity);
  const price = toNumber(line.unitPrice);
  const discount = toNumber(line.discount);
  return round2(qty * price * (1 - discount / 100));
}

export type VatBreakdownRow = Readonly<{
  rate: number;
  base: number;
  vat: number;
}>;

export type DocumentTotals = Readonly<{
  subtotal: number;
  vatAmount: number;
  total: number;
  lineTotals: readonly number[];
  vatBreakdown: readonly VatBreakdownRow[];
}>;

export function computeTotals(lines: readonly LineLike[]): DocumentTotals {
  const lineTotals = lines.map(computeLineTotal);
  const byRate = new Map<number, number>();
  lines.forEach((line, index) => {
    const rate = toNumber(line.vatRate);
    byRate.set(rate, round2((byRate.get(rate) ?? 0) + lineTotals[index]));
  });
  const vatBreakdown = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({
      rate,
      base,
      vat: round2((base * rate) / 100),
    }));
  const subtotal = round2(lineTotals.reduce((sum, t) => sum + t, 0));
  const vatAmount = round2(vatBreakdown.reduce((sum, r) => sum + r.vat, 0));
  return {
    subtotal,
    vatAmount,
    total: round2(subtotal + vatAmount),
    lineTotals,
    vatBreakdown,
  };
}

/** Aliquote IVA selezionabili nelle righe documento. */
export const VAT_RATE_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "4", label: "4%" },
  { value: "5", label: "5%" },
  { value: "10", label: "10%" },
  { value: "22", label: "22%" },
] as const;
