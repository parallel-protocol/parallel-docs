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
    const out = hero.apply(sourceWithFrontmatter, makeCtx("https://docs.parallel.best/")) as string;
    expect(out).toContain('alt="Enter the Parallel World"');
    // Un jeu de sources responsive, pas un fichier unique : le navigateur
    // choisit la largeur selon la densité de l'écran.
    expect(out).toContain('srcSet="/hero-750.webp 750w, /hero-1125.webp 1125w, /hero.webp 1500w"');
    // width/height intrinsèques : réservent la place avant le chargement.
    expect(out).toContain('width="1500" height="400"');
    // L'image doit être placée APRÈS le frontmatter, AVANT le ## Introduction
    const heroIdx = out.indexOf("<img");
    const introIdx = out.indexOf("## Introduction");
    const fmEndIdx = out.lastIndexOf("---\n");
    expect(heroIdx).toBeGreaterThan(fmEndIdx);
    expect(heroIdx).toBeLessThan(introIdx);
  });

  it("does NOT inject on non-root URLs", () => {
    const urls = [
      "https://docs.parallel.best/products/how-it-works",
      "https://docs.parallel.best/security/audits",
      "https://docs.parallel.best/developers-hub/addresses/eusd/ethereum",
    ];
    for (const url of urls) {
      expect(hero.apply(sourceWithFrontmatter, makeCtx(url))).toBe(sourceWithFrontmatter);
    }
  });

  it("is idempotent (running twice does not double-inject)", () => {
    const ctx = makeCtx("https://docs.parallel.best/");
    const once = hero.apply(sourceWithFrontmatter, ctx) as string;
    const twice = hero.apply(once, ctx) as string;
    expect(twice).toBe(once);
    // Une seule occurrence de l'image
    expect(once.match(/<img\b[^>]*alt="Enter the Parallel World"/g)?.length).toBe(1);
  });

  it("returns source unchanged for content without frontmatter (root)", () => {
    const noFm = "## Just content\n\nNo frontmatter.";
    const out = hero.apply(noFm, makeCtx("https://docs.parallel.best/"));
    expect(out).toBe(noFm);
  });

  it("exposes its name", () => {
    expect(hero.name).toBe("hero");
  });
});
