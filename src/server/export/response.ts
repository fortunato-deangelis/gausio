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
  const unicodeName = `${filename}.${kind}`;
  const asciiName =
    unicodeName
      .replace(/[^\x20-\x7e]+/g, "_")
      .replace(/["\\/]/g, "_")
      .slice(0, 180) || `export.${kind}`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(unicodeName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
