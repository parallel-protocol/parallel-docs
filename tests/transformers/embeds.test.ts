import { describe, expect, it } from "vitest";
import { embeds } from "../../scripts/crawler/transformers/embeds";
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

describe("embeds", () => {
  it("converts a self-closing {% embed url %} to a markdown link [url](url)", () => {
    const input = '{% embed url="https://app.eusd.xyz/transparency" %}';
    const out = embeds.apply(input, ctx) as string;
    expect(out).toBe("[https://app.eusd.xyz/transparency](https://app.eusd.xyz/transparency)");
  });

  it("strips leaked autolink <> wrapping the URL value (real eUSD case)", () => {
    const input = '{% embed url="<https://app.eusd.xyz/transparency>" %}';
    const out = embeds.apply(input, ctx) as string;
    expect(out).toBe("[https://app.eusd.xyz/transparency](https://app.eusd.xyz/transparency)");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("converts a block embed with body to [body](url)", () => {
    const input = '{% embed url="https://x.com/hello" %}custom text{% endembed %}';
    const out = embeds.apply(input, ctx) as string;
    expect(out).toBe("[custom text](https://x.com/hello)");
  });

  it("falls back to [url](url) when the body is empty/whitespace", () => {
    const input = '{% embed url="https://x.com" %}  {% endembed %}';
    const out = embeds.apply(input, ctx) as string;
    expect(out).toBe("[https://x.com](https://x.com)");
  });

  it("handles multiple embeds in one document", () => {
    const input = [
      "First:",
      '{% embed url="https://a.com" %}',
      "Then:",
      '{% embed url="https://b.com" %}',
    ].join("\n");
    const out = embeds.apply(input, ctx) as string;
    expect(out).toContain("[https://a.com](https://a.com)");
    expect(out).toContain("[https://b.com](https://b.com)");
  });

  it("returns source unchanged for content without embeds", () => {
    const input = "# Plain page\n\nNo embed here.";
    expect(embeds.apply(input, ctx)).toBe(input);
  });

  it("exposes its name", () => {
    expect(embeds.name).toBe("embeds");
  });
});
