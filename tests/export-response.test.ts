import { describe, expect, it } from "vitest";
import { fileResponse } from "@/server/export/response";

describe("header download export", () => {
  it("neutralizza caratteri di controllo e conserva il nome UTF-8", () => {
    const response = fileResponse(Buffer.from("x"), 'report\r\nX-Evil: 1/è', "pdf");
    const disposition = response.headers.get("Content-Disposition") ?? "";

    expect(disposition).not.toContain("\r");
    expect(disposition).not.toContain("\n");
    expect(disposition).toContain("filename*=UTF-8''");
    expect(disposition).toContain("%C3%A8.pdf");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
});
