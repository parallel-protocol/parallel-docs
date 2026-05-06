import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { htmlAttrs } from "../../scripts/crawler/transformers/htmlAttrs";
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

describe("htmlAttrs", () => {
  const fixture = readFileSync(resolve(fixturesDir, "with-html-class.md"), "utf-8");

  it("converts class= to className= on a simple anchor", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain('<a href="/discover" className="button primary">');
    expect(out).not.toContain('<a href="/discover" class="button primary">');
  });

  it("converts class= on a multi-attribute tag (preserves other attrs)", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain(
      '<div className="grid two-cols" id="features" data-foo="bar">',
    );
  });

  it("does NOT touch existing className= (no double conversion)", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain('<a href="/x" className="link">already JSX</a>');
    // Pas de "classNameName" introduit
    expect(out).not.toMatch(/classNameName/);
  });

  it("does not touch tags without class", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain('<span id="just-id">no class here</span>');
  });

  it("does not touch the word 'class' in prose (no leading <tag …)", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain("a class of objects, the class hierarchy.");
  });

  it("is idempotent", () => {
    const once = htmlAttrs.apply(fixture, ctx) as string;
    const twice = htmlAttrs.apply(once, ctx) as string;
    expect(twice).toBe(once);
  });

  it("is a no-op for content without any HTML class= attribute", () => {
    const input = "# Pure markdown\n\nNo HTML here.\n\n[link](/x)\n";
    expect(htmlAttrs.apply(input, ctx)).toBe(input);
  });

  it("self-closes void <img> tags (JSX requires it)", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain('<img src="/images/abc.png" alt="diagram" />');
    expect(out).not.toMatch(/<img src="\/images\/abc\.png" alt="diagram">/);
  });

  it("self-closes void <br> tags", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain("<br />");
    expect(out).not.toMatch(/<br>(?!\s*\/)/);
  });

  it("does NOT double self-close already <img />", () => {
    const out = htmlAttrs.apply(fixture, ctx) as string;
    expect(out).toContain('<img src="/x.png" alt="ok" />');
    expect(out).not.toContain("/ />");
    expect(out).not.toContain("/  />");
  });

  it("does not touch non-void elements like <a>, <div>, <span>, <figure>", () => {
    const input =
      "<a href='/x'>link</a> <div>x</div> <span>y</span> <figure>z</figure>";
    const out = htmlAttrs.apply(input, ctx) as string;
    expect(out).toBe(input);
  });

  it("self-closes <hr> and <input> (other void elements)", () => {
    const input = '<hr> and <input type="text">';
    const out = htmlAttrs.apply(input, ctx) as string;
    expect(out).toBe('<hr /> and <input type="text" />');
  });

  it("exposes its name", () => {
    expect(htmlAttrs.name).toBe("htmlAttrs");
  });
});
