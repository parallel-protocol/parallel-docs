import { describe, expect, it } from "vitest";
import { pageIndexCards } from "../../scripts/crawler/transformers/pageIndexCards";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

function ctx(url: string): TransformContext {
  return {
    url,
    outputPath: "docs/pages/test/index.mdx",
    imagesDir: "docs/public/images",
    cache: noopCache,
  };
}

const HOW_IT_WORKS_BODY = [
  "# How It Works",
  "",
  "- [Classic Vaults](https://docs.parallel.best/products/parallel-v2/how-it-works/vaults.md)",
  "- [Depositing](https://docs.parallel.best/products/parallel-v2/how-it-works/vaults/depositing.md)",
  "- [Borrowing](https://docs.parallel.best/products/parallel-v2/how-it-works/vaults/borrowing.md)",
  "- [Bridging Module](https://docs.parallel.best/products/parallel-v2/how-it-works/bridging-module.md)",
  "- [LayerZero Infrastructure](https://docs.parallel.best/products/parallel-v2/how-it-works/bridging-module/layerzero-infrastructure.md)",
  "- [Super Vaults (SV)](https://docs.parallel.best/products/parallel-v2/how-it-works/super-vaults-sv.md)",
  "- [Leveraging](https://docs.parallel.best/products/parallel-v2/how-it-works/super-vaults-sv/leveraging.md)",
  "",
].join("\n");

const HOW_IT_WORKS_URL =
  "https://docs.parallel.best/products/parallel-v2/how-it-works";

describe("pageIndexCards", () => {
  it("detects the auto-TOC pattern and emits <PageCardGrid> with immediate children only", () => {
    const out = pageIndexCards.apply(HOW_IT_WORKS_BODY, ctx(HOW_IT_WORKS_URL));
    expect(out).toContain("<PageCardGrid items={");
    expect(out).toContain(
      "import { PageCardGrid } from '@/components/PageCardGrid'",
    );

    // Extract the items JSON
    const m = (out as string).match(/<PageCardGrid items=\{(\[[\s\S]*?\])\}/);
    expect(m).not.toBeNull();
    const items = JSON.parse(m![1]);
    // Only 3 immediate children — grandchildren filtered out
    expect(items).toEqual([
      {
        title: "Classic Vaults",
        href: "/products/parallel-v2/how-it-works/vaults",
      },
      {
        title: "Bridging Module",
        href: "/products/parallel-v2/how-it-works/bridging-module",
      },
      {
        title: "Super Vaults (SV)",
        href: "/products/parallel-v2/how-it-works/super-vaults-sv",
      },
    ]);
  });

  it("preserves the H1 above the grid", () => {
    const out = pageIndexCards.apply(HOW_IT_WORKS_BODY, ctx(HOW_IT_WORKS_URL)) as string;
    expect(out).toMatch(/# How It Works\s+<PageCardGrid/);
  });

  it("is idempotent (running twice does not double-inject)", () => {
    const once = pageIndexCards.apply(
      HOW_IT_WORKS_BODY,
      ctx(HOW_IT_WORKS_URL),
    ) as string;
    const twice = pageIndexCards.apply(once, ctx(HOW_IT_WORKS_URL));
    expect(twice).toBe(once);
    // Single occurrence
    const matches = once.match(/<PageCardGrid/g);
    expect(matches?.length).toBe(1);
  });

  it("does NOT touch a page with prose intro before the list", () => {
    const body = [
      "# Section",
      "",
      "Welcome to this section. It explains how things work.",
      "",
      "- [Foo](https://docs.parallel.best/section/foo.md)",
      "- [Bar](https://docs.parallel.best/section/bar.md)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(body, ctx("https://docs.parallel.best/section"));
    expect(out).toBe(body);
  });

  it("does NOT touch a page with only 1 link (not worth converting)", () => {
    const body = [
      "# Section",
      "",
      "- [Only Child](https://docs.parallel.best/section/only.md)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(body, ctx("https://docs.parallel.best/section"));
    expect(out).toBe(body);
  });

  it("does NOT touch a page without an H1", () => {
    const body = [
      "Some intro without H1.",
      "",
      "- [A](/foo/a.md)",
      "- [B](/foo/b.md)",
    ].join("\n");
    const out = pageIndexCards.apply(body, ctx("https://docs.parallel.best/foo"));
    expect(out).toBe(body);
  });

  it("normalizes both full GitBook URLs and relative .md paths", () => {
    const body = [
      "# Mixed",
      "",
      "- [A](https://docs.parallel.best/mixed/a.md)",
      "- [B](/mixed/b.md)",
      "- [C](/mixed/c)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(
      body,
      ctx("https://docs.parallel.best/mixed"),
    ) as string;
    const m = out.match(/<PageCardGrid items=\{(\[[\s\S]*?\])\}/);
    const items = JSON.parse(m![1]);
    expect(items).toEqual([
      { title: "A", href: "/mixed/a" },
      { title: "B", href: "/mixed/b" },
      { title: "C", href: "/mixed/c" },
    ]);
  });

  it("supports both - and * bullet markers", () => {
    const body = [
      "# Mixed bullets",
      "",
      "* [A](/mixed/a.md)",
      "- [B](/mixed/b.md)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(
      body,
      ctx("https://docs.parallel.best/mixed"),
    ) as string;
    expect(out).toContain("<PageCardGrid items=");
    const m = out.match(/<PageCardGrid items=\{(\[[\s\S]*?\])\}/);
    const items = JSON.parse(m![1]);
    expect(items).toHaveLength(2);
  });

  it("skips when fewer than 2 immediate children remain after filtering", () => {
    const body = [
      "# Single",
      "",
      "- [Only Direct Child](/single/only.md)",
      "- [Grandchild Foo](/single/only/foo.md)",
      "- [Grandchild Bar](/single/only/bar.md)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(
      body,
      ctx("https://docs.parallel.best/single"),
    );
    expect(out).toBe(body);
  });

  it("skips external URLs (non-internal links)", () => {
    const body = [
      "# Resources",
      "",
      "- [GitHub](https://github.com/parallel)",
      "- [Twitter](https://x.com/parallel)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(body, ctx("https://docs.parallel.best/resources"));
    // External URLs → no internal hrefs → fewer than 2 valid → no transform
    expect(out).toBe(body);
  });

  it("strips trailing slashes and #anchors when normalizing href", () => {
    const body = [
      "# Page",
      "",
      "- [A](/page/a.md#section)",
      "- [B](/page/b/)",
      "",
    ].join("\n");
    const out = pageIndexCards.apply(
      body,
      ctx("https://docs.parallel.best/page"),
    ) as string;
    const m = out.match(/<PageCardGrid items=\{(\[[\s\S]*?\])\}/);
    const items = JSON.parse(m![1]);
    expect(items).toEqual([
      { title: "A", href: "/page/a" },
      { title: "B", href: "/page/b" },
    ]);
  });

  it("exposes its name", () => {
    expect(pageIndexCards.name).toBe("pageIndexCards");
  });
});
