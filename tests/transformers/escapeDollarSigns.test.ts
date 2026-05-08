import { describe, expect, it } from "vitest";
import { escapeDollarSigns } from "../../scripts/crawler/transformers/escapeDollarSigns";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

const ctx: TransformContext = {
  url: "https://docs.parallel.best/test",
  outputPath: "docs/pages/test.mdx",
  imagesDir: "docs/public/images",
  cache: noopCache,
};

describe("escapeDollarSigns", () => {
  it("escapes monetary $ before a digit (1$)", () => {
    const out = escapeDollarSigns.apply("paUSD trades at 1$ peg.", ctx);
    expect(out).toBe("paUSD trades at 1\\$ peg.");
  });

  it("escapes monetary $ after a digit ($1)", () => {
    const out = escapeDollarSigns.apply("Pegged to $1 USD.", ctx);
    expect(out).toBe("Pegged to \\$1 USD.");
  });

  it("escapes both opening and closing $ in the same paragraph", () => {
    const input =
      "for every 1$ of paUSD out there, you can be sure that it's backed with more than 1$ worth of another asset";
    const out = escapeDollarSigns.apply(input, ctx);
    expect(out).toContain("1\\$ of paUSD");
    expect(out).toContain("more than 1\\$ worth");
    // Pas de $ non-escapé restant (à part en intra-mot, pas le cas ici)
    expect(out).not.toMatch(/(?<!\\)\$/);
  });

  it("escapes $0.5 / $2k / $10M / 1.5$ patterns", () => {
    const out = escapeDollarSigns.apply(
      "Worth $0.5, $2k, $10M, or 1.5$ depending on chain.",
      ctx,
    );
    expect(out).toBe(
      "Worth \\$0.5, \\$2k, \\$10M, or 1.5\\$ depending on chain.",
    );
  });

  it("preserves $$...$$ block math content untouched", () => {
    const input = "Text with 1$.\n\n$$\nf(x) = x^2 + 5\n$$\n\nMore text 2$.";
    const out = escapeDollarSigns.apply(input, ctx);
    expect(out).toContain("1\\$");
    expect(out).toContain("$$\nf(x) = x^2 + 5\n$$");
    expect(out).toContain("2\\$");
  });

  it("does NOT double-escape an already-escaped \\$ (idempotent)", () => {
    const input = "Already escaped: \\$1 here.";
    const out = escapeDollarSigns.apply(input, ctx);
    expect(out).toBe(input);
    // Run twice
    const twice = escapeDollarSigns.apply(out, ctx);
    expect(twice).toBe(out);
  });

  it("handles multiple math blocks separated by text with $", () => {
    const input = "Pre 1$.\n\n$$x=y$$\n\nMid 2$.\n\n$$a=b$$\n\nPost 3$.";
    const out = escapeDollarSigns.apply(input, ctx);
    expect(out).toBe("Pre 1\\$.\n\n$$x=y$$\n\nMid 2\\$.\n\n$$a=b$$\n\nPost 3\\$.");
  });

  it("is a no-op on text without any $", () => {
    const input = "Just words, no special chars.\n\nNot even one.";
    expect(escapeDollarSigns.apply(input, ctx)).toBe(input);
  });

  it("escapes $ followed by letters too (e.g. $foo) — Parallel docs use no inline $..$ math", () => {
    // En contexte Parallel ce n'est pas un cas réel mais on documente le comportement :
    // sans bloc $$..$$ l'heuristique escape TOUS les $.
    const out = escapeDollarSigns.apply("Var $foo and $bar.", ctx);
    expect(out).toBe("Var \\$foo and \\$bar.");
  });

  it("preserves $$ math containing $ characters internally (rare, e.g. \\$ TeX cmd)", () => {
    // KaTeX accepte `\$` comme literal dollar dans une formule.
    const input = "Block:\n\n$$ price = \\$100 \\cdot rate $$\n\nText 1$.";
    const out = escapeDollarSigns.apply(input, ctx);
    // Le bloc reste tel quel
    expect(out).toContain("$$ price = \\$100 \\cdot rate $$");
    expect(out).toContain("Text 1\\$.");
  });

  it("exposes its name", () => {
    expect(escapeDollarSigns.name).toBe("escapeDollarSigns");
  });
});
