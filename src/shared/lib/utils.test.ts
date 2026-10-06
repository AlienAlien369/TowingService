import { describe, expect, it } from "vitest";
import { formatINR, haversineKm, indianFinancialYear, normalizeEmail, normalizePhone, randomCode, renderTemplate } from "./utils";
import { renderMarkdown } from "./markdown";

describe("normalizePhone", () => {
  it("accepts common Indian formats", () => {
    for (const p of ["9876543210", "+91 98765 43210", "09876543210", "91-9876543210"]) expect(normalizePhone(p)).toBe("+919876543210");
  });
  it("rejects bad numbers", () => {
    for (const p of ["12345", "5876543210", "98765432101234", ""]) expect(normalizePhone(p)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lower-cases and validates", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
    expect(normalizeEmail("nope")).toBeNull();
  });
});

describe("indianFinancialYear", () => {
  it("rolls over on 1 April", () => {
    expect(indianFinancialYear(new Date("2026-03-31T10:00:00"))).toBe("2025-26");
    expect(indianFinancialYear(new Date("2026-04-01T10:00:00"))).toBe("2026-27");
    expect(indianFinancialYear(new Date("2026-12-31T10:00:00"))).toBe("2026-27");
  });
});

describe("renderTemplate", () => {
  it("fills known keys and leaves unknown ones visible", () => {
    expect(renderTemplate("Hi {{brand}} {{ missing }}", { brand: "X" })).toBe("Hi X {{ missing }}");
  });
});

describe("formatINR", () => {
  it("formats paise as rupees", () => {
    expect(formatINR(150000)).toContain("1,500");
    expect(formatINR(150050)).toContain("1,500.50");
  });
});

describe("haversineKm", () => {
  it("is roughly right for Connaught Place → Saket", () => {
    const km = haversineKm({ lat: 28.6315, lng: 77.2167 }, { lat: 28.5355, lng: 77.21 });
    expect(km).toBeGreaterThan(10);
    expect(km).toBeLessThan(11.5);
  });
});

describe("randomCode", () => {
  it("never emits ambiguous characters", () => {
    for (let i = 0; i < 200; i++) expect(randomCode(8)).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  });
});

describe("renderMarkdown", () => {
  it("escapes raw HTML (no script injection)", () => {
    const html = renderMarkdown("<script>alert(1)</script> **bold**");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>bold</strong>");
  });
  it("only allows safe link schemes", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("<a ");
    expect(renderMarkdown("[ok](https://example.com)")).toContain('href="https://example.com"');
  });
  it("keeps numbered sub-clauses on separate lines", () => {
    expect(renderMarkdown("1.1 first\n1.2 second")).toContain("<br />");
  });
  it("builds headings and lists", () => {
    const h = renderMarkdown("# T\n- a\n- b");
    expect(h).toContain("<h2>T</h2>");
    expect(h).toContain("<ul>");
  });
});
