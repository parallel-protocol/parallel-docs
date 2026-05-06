import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hashtagHeadings } from "../../scripts/crawler/transformers/hashtagHeadings";

const fixturesDir = resolve(__dirname, "../fixtures");
const ctx = {
  url: "https://docs.eusd.xyz/test",
  outputPath: "docs/pages/test.mdx",
  imagesDir: "docs/public/images",
  cache: new Map() as any,
};

describe("hashtagHeadings", () => {
  it("removes the GitBook hashtag picto from H2", () => {
    const input = readFileSync(resolve(fixturesDir, "with-hashtag-headings.md"), "utf-8");
    const out = hashtagHeadings.apply(input, ctx) as string;

    expect(out).toMatch(/^## Mechanism$/m);
    expect(out).not.toMatch(/^## #️⃣/m);
  });

  it("removes picto from H3 even without space", () => {
    const input = readFileSync(resolve(fixturesDir, "with-hashtag-headings.md"), "utf-8");
    const out = hashtagHeadings.apply(input, ctx) as string;

    expect(out).toMatch(/^### Sub-mechanism$/m);
  });

  it("preserves clean headings (no-op when no picto)", () => {
    const input = readFileSync(resolve(fixturesDir, "with-hashtag-headings.md"), "utf-8");
    const out = hashtagHeadings.apply(input, ctx) as string;

    expect(out).toMatch(/^## Without picto$/m);
  });

  it("collapses multiple spaces after picto removal", () => {
    const input = readFileSync(resolve(fixturesDir, "with-hashtag-headings.md"), "utf-8");
    const out = hashtagHeadings.apply(input, ctx) as string;

    expect(out).toMatch(/^### Spaced picto$/m);
  });

  it("does not touch H1", () => {
    const input = "# #️⃣ Title\n\n## #️⃣ Section\n";
    const out = hashtagHeadings.apply(input, ctx) as string;

    expect(out).toMatch(/^# #️⃣ Title$/m);
    expect(out).toMatch(/^## Section$/m);
  });

  it("is a full no-op when no headings have pictos", () => {
    const input = readFileSync(resolve(fixturesDir, "clean-headings.md"), "utf-8");
    const out = hashtagHeadings.apply(input, ctx) as string;
    expect(out).toBe(input);
  });

  it("is idempotent", () => {
    const input = readFileSync(resolve(fixturesDir, "with-hashtag-headings.md"), "utf-8");
    const once = hashtagHeadings.apply(input, ctx) as string;
    const twice = hashtagHeadings.apply(once, ctx) as string;
    expect(twice).toBe(once);
  });

  it("exposes its name", () => {
    expect(hashtagHeadings.name).toBe("hashtagHeadings");
  });
});
