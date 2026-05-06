import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stripFooter } from "../../scripts/crawler/transformers/stripFooter";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const fixturesDir = resolve(__dirname, "../fixtures");

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

describe("stripFooter", () => {
  it("removes the GitBook auto-footer up to end of file", () => {
    const input = readFileSync(resolve(fixturesDir, "with-footer.md"), "utf-8");
    const output = stripFooter.apply(input, ctx) as string;

    expect(output).not.toContain("Agent Instructions");
    expect(output).not.toContain("AI assistant");
    expect(output.trimEnd().endsWith("[link](/foo/bar).")).toBe(true);
  });

  it("is a no-op when no footer is present", () => {
    const input = readFileSync(resolve(fixturesDir, "without-footer.md"), "utf-8");
    const output = stripFooter.apply(input, ctx) as string;

    expect(output).toBe(input);
  });

  it("is idempotent (running twice gives the same output)", () => {
    const input = readFileSync(resolve(fixturesDir, "with-footer.md"), "utf-8");
    const once = stripFooter.apply(input, ctx) as string;
    const twice = stripFooter.apply(once, ctx) as string;
    expect(twice).toBe(once);
  });

  it("exposes its name for logging", () => {
    expect(stripFooter.name).toBe("stripFooter");
  });
});
