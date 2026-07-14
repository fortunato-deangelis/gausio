import "server-only";

/** Risposta HTTP di download per gli export. */
export function fileResponse(
  buffer: Buffer,
  filename: string,
  kind: "pdf" | "xlsx"
): Response {
  const mime =
    kind === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}.${kind}"`,
      "Cache-Control": "no-store",
    },
  });
}
