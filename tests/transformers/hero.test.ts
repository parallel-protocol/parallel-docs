import { describe, expect, it } from "vitest";
import { hero } from "../../scripts/crawler/transformers/hero";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

function makeCtx(url: string): TransformContext {
  return {
    url,
    outputPath: "docs/pages/test.mdx",
    imagesDir: "docs/public/images",
    cache: noopCache,
  };
}

describe("hero", () => {
  const sourceWithFrontmatter = [
    "---",
    "title: Overview",
    "description: ''",
    "---",
    "## Introduction",
    "",
    "Body.",
  ].join("\n");

  it("injects the hero image on the root URL (/)", () => {
    const out = hero.apply(sourceWithFrontmatter, makeCtx("https://docs.eusd.xyz/")) as string;
    expect(out).toContain('<img src="/hero.png"');
    expect(out).toContain("The Eden — Native Stablecoin");
    // L'image doit être placée APRÈS le frontmatter, AVANT le ## Introduction
    const heroIdx = out.indexOf('<img src="/hero.png"');
    const introIdx = out.indexOf("## Introduction");
    const fmEndIdx = out.lastIndexOf("---\n");
    expect(heroIdx).toBeGreaterThan(fmEndIdx);
    expect(heroIdx).toBeLessThan(introIdx);
  });

  it("does NOT inject on non-root URLs", () => {
    const urls = [
      "https://docs.eusd.xyz/products/how-it-works",
      "https://docs.eusd.xyz/security/audits",
      "https://docs.eusd.xyz/developers-hub/addresses/eusd/ethereum",
    ];
    for (const url of urls) {
      expect(hero.apply(sourceWithFrontmatter, makeCtx(url))).toBe(sourceWithFrontmatter);
    }
  });

  it("is idempotent (running twice does not double-inject)", () => {
    const ctx = makeCtx("https://docs.eusd.xyz/");
    const once = hero.apply(sourceWithFrontmatter, ctx) as string;
    const twice = hero.apply(once, ctx) as string;
    expect(twice).toBe(once);
    // Une seule occurrence de l'image
    expect(once.match(/<img src="\/hero\.png"/g)?.length).toBe(1);
  });

  it("returns source unchanged for content without frontmatter (root)", () => {
    const noFm = "## Just content\n\nNo frontmatter.";
    const out = hero.apply(noFm, makeCtx("https://docs.eusd.xyz/"));
    expect(out).toBe(noFm);
  });

  it("exposes its name", () => {
    expect(hero.name).toBe("hero");
  });
});
