import { describe, expect, it } from "vitest";
import { formatDate, getInitials, truncateAddress } from "./utils";

describe("truncateAddress", () => {
  it("keeps the first 6 and last 4 chars by default with a Unicode ellipsis", () => {
    const addr = "0x1234567890abcdef1234567890abcdefabcdef12" as const;
    expect(truncateAddress(addr)).toBe("0x1234…ef12");
  });

  it("honours custom head and tail lengths", () => {
    const addr = "0x1234567890abcdef1234567890abcdefabcdef12" as const;
    expect(truncateAddress(addr, 4, 6)).toBe("0x12…cdef12");
  });

  it("returns the address unchanged when it is shorter than head + tail", () => {
    const addr = "0xabcd" as const;
    expect(truncateAddress(addr)).toBe("0xabcd");
  });
});

describe("formatDate", () => {
  it("formats an ISO date in en-US short form by default", () => {
    expect(formatDate("2025-11-20T00:00:00Z")).toBe("Nov 20, 2025");
  });

  it("respects the provided locale", () => {
    const formatted = formatDate("2025-11-20T00:00:00Z", "fr-FR");
    expect(formatted).toMatch(/2025/);
    expect(formatted).toMatch(/20/);
  });

  it("throws on an invalid date string", () => {
    expect(() => formatDate("not-a-date")).toThrow(/Invalid date/);
  });
});

describe("getInitials", () => {
  it("returns the first letter of each word, preserving case", () => {
    expect(getInitials("Trail of Bits")).toBe("ToB");
  });

  it("caps the result at `max` letters", () => {
    expect(getInitials("Trail of Bits and Co", 2)).toBe("To");
  });

  it("handles single-word names", () => {
    expect(getInitials("OpenZeppelin")).toBe("O");
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });
});
