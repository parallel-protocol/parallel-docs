import { describe, expect, it } from "vitest";
import { hints } from "../../scripts/crawler/transformers/hints";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

const ctx: TransformContext = {
  url: "https://docs.eusd.xyz/test",
  outputPath: "docs/pages/test.mdx",
  imagesDir: "docs/public/images",
  cache: noopCache,
};

describe("hints", () => {
  it("converts {% hint style=\"info\" %} to :::info Vocs callout", () => {
    const input = '{% hint style="info" %}\nNote text.\n{% endhint %}';
    const out = hints.apply(input, ctx) as string;
    expect(out).toBe(":::info\nNote text.\n:::");
  });

  it("converts warning, danger, tip, success, note styles", () => {
    for (const style of ["warning", "danger", "tip", "success", "note"]) {
      const input = `{% hint style="${style}" %}body{% endhint %}`;
      const out = hints.apply(input, ctx) as string;
      expect(out).toBe(`:::${style}\nbody\n:::`);
    }
  });

  it("trims whitespace inside the hint body", () => {
    const input = '{% hint style="info" %}\n\n  Hello world.  \n\n{% endhint %}';
    const out = hints.apply(input, ctx) as string;
    expect(out).toBe(":::info\nHello world.\n:::");
  });

  it("handles multiple hints in one document", () => {
    const input = [
      "Some intro.",
      "",
      '{% hint style="info" %}A{% endhint %}',
      "",
      "Middle text.",
      "",
      '{% hint style="warning" %}B{% endhint %}',
    ].join("\n");
    const out = hints.apply(input, ctx) as string;
    expect(out).toContain(":::info\nA\n:::");
    expect(out).toContain(":::warning\nB\n:::");
    expect(out).toContain("Some intro.");
    expect(out).toContain("Middle text.");
  });

  it("preserves multi-line content with markdown formatting", () => {
    const input = '{% hint style="info" %}\n**Bold** and a [link](/x).\n\nSecond paragraph.\n{% endhint %}';
    const out = hints.apply(input, ctx) as string;
    expect(out).toContain("**Bold** and a [link](/x).");
    expect(out).toContain("Second paragraph.");
  });

  it("returns source unchanged for content without hints", () => {
    const input = "# Plain page\n\nSome content.";
    expect(hints.apply(input, ctx)).toBe(input);
  });

  it("does not transform unknown styles (regex doesn't match)", () => {
    const input = '{% hint style="bogus" %}content{% endhint %}';
    const out = hints.apply(input, ctx) as string;
    expect(out).toBe(input); // pas matché car bogus n'est pas dans le set
  });

  it("exposes its name", () => {
    expect(hints.name).toBe("hints");
  });
});
