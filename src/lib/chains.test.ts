import { describe, expect, it } from "vitest";
import { CHAIN_LABELS, type ChainSlug, EXPLORERS } from "./chains";

const SLUGS: ChainSlug[] = ["ethereum", "sei", "base", "sonic", "arbitrum", "polygon", "fantom"];

describe("CHAIN_LABELS", () => {
  it("provides a non-empty label for every ChainSlug", () => {
    for (const slug of SLUGS) {
      expect(CHAIN_LABELS[slug]).toBeTruthy();
      expect(typeof CHAIN_LABELS[slug]).toBe("string");
    }
  });
});

describe("EXPLORERS", () => {
  const ADDR = "0x0000000000000000000000000000000000000000";

  it("returns an https URL containing the address for every ChainSlug", () => {
    for (const slug of SLUGS) {
      const url = EXPLORERS[slug](ADDR);
      expect(url.startsWith("https://")).toBe(true);
      expect(url).toContain(ADDR);
    }
  });

  it("uses the documented host per chain", () => {
    expect(EXPLORERS.ethereum(ADDR)).toContain("etherscan.io");
    expect(EXPLORERS.sei(ADDR)).toContain("seitrace.com");
    expect(EXPLORERS.base(ADDR)).toContain("basescan.org");
    expect(EXPLORERS.sonic(ADDR)).toContain("sonicscan.org");
    expect(EXPLORERS.arbitrum(ADDR)).toContain("arbiscan.io");
    expect(EXPLORERS.polygon(ADDR)).toContain("polygonscan.com");
    expect(EXPLORERS.fantom(ADDR)).toContain("ftmscan.com");
  });
});
