import { describe, expect, it } from "vitest";
import { htmlEntities } from "../../scripts/crawler/transformers/htmlEntities";
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

describe("htmlEntities", () => {
  it("decodes &#x20; to a regular space", () => {
    const out = htmlEntities.apply("Pegged to USD.&#x20;Stable.", ctx);
    expect(out).toBe("Pegged to USD. Stable.");
  });

  it("strips trailing whitespace introduced by end-of-line &#x20;", () => {
    // GitBook pattern : "text.&#x20;\n" → after decode "text. \n" → strip trailing
    const out = htmlEntities.apply("Sentence ending.&#x20;\nNext line.", ctx);
    expect(out).toBe("Sentence ending.\nNext line.");
  });

  it("strips trailing whitespace from headings (### Title&#x20;)", () => {
    const out = htmlEntities.apply("### PAR is non-custodial&#x20;\n", ctx);
    expect(out).toBe("### PAR is non-custodial\n");
  });

  it("is a no-op on text without &#x20; or trailing whitespace", () => {
    const input = "Just clean markdown.\n\nNo entities here.";
    expect(htmlEntities.apply(input, ctx)).toBe(input);
  });

  it("is idempotent (running twice yields the same output)", () => {
    const input = "Foo&#x20;\nBar&#x20;&#x20;\n";
    const once = htmlEntities.apply(input, ctx);
    const twice = htmlEntities.apply(once, ctx);
    expect(twice).toBe(once);
  });

  it("does NOT collapse multiple spaces in the middle of a line", () => {
    // Préserver le contenu intentionnel (ex. table alignment)
    const input = "| Col1   | Col2 |\n";
    expect(htmlEntities.apply(input, ctx)).toBe(input);
  });

  it("handles consecutive &#x20;&#x20; correctly (decodes both, then trims if EOL)", () => {
    const out = htmlEntities.apply("End&#x20;&#x20;\n", ctx);
    expect(out).toBe("End\n");
  });

  it("exposes its name", () => {
    expect(htmlEntities.name).toBe("htmlEntities");
  });
});
