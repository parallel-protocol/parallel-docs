import { describe, expect, it } from "vitest";
import {
  buildEntry,
  gitbookMdUrlFor,
  hasChildren,
  tmpRelPathFor,
} from "../scripts/crawler/sitemap";

const allUrls = [
  "https://docs.eusd.xyz",
  "https://docs.eusd.xyz/introduction/product",
  "https://docs.eusd.xyz/products/how-it-works",
  "https://docs.eusd.xyz/products/how-it-works/stabilizer-module",
  "https://docs.eusd.xyz/products/how-it-works/flashloan-module",
  "https://docs.eusd.xyz/products/eusd",
  "https://docs.eusd.xyz/products/eusd/implementation",
  "https://docs.eusd.xyz/security/audits",
  "https://docs.eusd.xyz/developers-hub/addresses/eusd",
  "https://docs.eusd.xyz/developers-hub/addresses/eusd/ethereum",
];

describe("sitemap.hasChildren", () => {
  it("is true when at least one URL is a strict child", () => {
    expect(hasChildren("https://docs.eusd.xyz/products/how-it-works", allUrls)).toBe(true);
  });

  it("is false for leaf pages", () => {
    expect(hasChildren("https://docs.eusd.xyz/security/audits", allUrls)).toBe(false);
  });

  it("does not match prefix-only URLs (no slash boundary)", () => {
    // /products/eusd has child /products/eusd/implementation, but
    // /products/eusd-something would not be considered a child.
    const urls = [
      "https://docs.eusd.xyz/products/eusd",
      "https://docs.eusd.xyz/products/eusd-extra",
    ];
    expect(hasChildren("https://docs.eusd.xyz/products/eusd", urls)).toBe(false);
  });
});

describe("sitemap.buildEntry", () => {
  it("emits docs/pages/index.mdx for the root URL", () => {
    const entry = buildEntry("https://docs.eusd.xyz", allUrls);
    expect(entry.outputPath).toBe("docs/pages/index.mdx");
    expect(entry.pathname).toBe("/");
  });

  it("emits <path>/index.mdx when the URL has children", () => {
    const entry = buildEntry("https://docs.eusd.xyz/products/how-it-works", allUrls);
    expect(entry.outputPath).toBe("docs/pages/products/how-it-works/index.mdx");
    expect(entry.pathname).toBe("/products/how-it-works");
  });

  it("emits <path>.mdx for leaf pages", () => {
    const entry = buildEntry("https://docs.eusd.xyz/security/audits", allUrls);
    expect(entry.outputPath).toBe("docs/pages/security/audits.mdx");
  });

  it("emits <path>/index.mdx for nested parents", () => {
    const entry = buildEntry("https://docs.eusd.xyz/developers-hub/addresses/eusd", allUrls);
    expect(entry.outputPath).toBe("docs/pages/developers-hub/addresses/eusd/index.mdx");
  });

  it("emits <path>.mdx for nested leaves (parent has children but the leaf doesn't)", () => {
    const entry = buildEntry(
      "https://docs.eusd.xyz/products/how-it-works/stabilizer-module",
      allUrls,
    );
    expect(entry.outputPath).toBe(
      "docs/pages/products/how-it-works/stabilizer-module.mdx",
    );
  });
});

describe("sitemap.tmpRelPathFor", () => {
  it("uses index.md for the root entry", () => {
    const entry = buildEntry("https://docs.eusd.xyz", allUrls);
    expect(tmpRelPathFor(entry)).toBe("index.md");
  });

  it("uses <path>/index.md for parent entries", () => {
    const entry = buildEntry("https://docs.eusd.xyz/products/how-it-works", allUrls);
    expect(tmpRelPathFor(entry)).toBe("products/how-it-works/index.md");
  });

  it("uses <path>.md for leaf entries", () => {
    const entry = buildEntry("https://docs.eusd.xyz/security/audits", allUrls);
    expect(tmpRelPathFor(entry)).toBe("security/audits.md");
  });
});

describe("sitemap.gitbookMdUrlFor", () => {
  it("returns origin/.md for the root (verified empirically: /index.md → 'Page Not Found')", () => {
    const entry = buildEntry("https://docs.eusd.xyz", allUrls);
    expect(gitbookMdUrlFor(entry)).toBe("https://docs.eusd.xyz/.md");
  });

  it("appends .md to non-root URLs", () => {
    const entry = buildEntry("https://docs.eusd.xyz/security/audits", allUrls);
    expect(gitbookMdUrlFor(entry)).toBe("https://docs.eusd.xyz/security/audits.md");
  });

  it("appends .md to parent URLs (without trailing slash)", () => {
    const entry = buildEntry("https://docs.eusd.xyz/products/how-it-works", allUrls);
    expect(gitbookMdUrlFor(entry)).toBe(
      "https://docs.eusd.xyz/products/how-it-works.md",
    );
  });
});
