import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { pageHeader } from "../../scripts/crawler/transformers/pageHeader";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

function ctx(url: string, validRoutes?: ReadonlySet<string>): TransformContext {
  return {
    url,
    outputPath: "docs/pages/test.mdx",
    imagesDir: "docs/public/images",
    cache: noopCache,
    validRoutes,
  };
}

const PLAIN_BODY = "# Stabilizer Module\n\nIntro paragraph.\n";

describe("pageHeader", () => {
  it("emits PageHeader with title and empty breadcrumb on root path", () => {
    const input = `---\ntitle: Home\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(input, ctx("https://docs.eusd.xyz/")) as string;
    expect(out).toContain(`import { PageHeader } from '@/components/PageHeader'`);
    expect(out).toContain('breadcrumb={[]}');
    expect(out).toContain('title={"Home"}');
  });

  it("is a no-op when there's no breadcrumb, no title, and no subtitle", () => {
    const input = `---\nfoo: bar\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(input, ctx("https://docs.eusd.xyz/")) as string;
    expect(out).toBe(input);
  });

  it("emits ONE breadcrumb entry for a single-level path (last segment excluded)", () => {
    const input = `---\ntitle: Product\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/introduction/product"),
    ) as string;

    expect(out).toContain(`import { PageHeader } from '@/components/PageHeader'`);
    // breadcrumb should contain only "Introduction" (last "product" excluded)
    const m = out.match(/breadcrumb=\{(\[[^\]]*\])\}/);
    expect(m).not.toBeNull();
    const breadcrumb = JSON.parse(m![1]);
    expect(breadcrumb).toEqual([{ label: "Introduction", href: "/introduction" }]);
  });

  it("emits THREE breadcrumb entries for a 4-level path", () => {
    const input = `---\ntitle: RedStone\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/developers-hub/onchain-tools/oracles/redstone"),
    ) as string;

    const m = out.match(/breadcrumb=\{(\[[^\]]*\])\}/);
    expect(m).not.toBeNull();
    const breadcrumb = JSON.parse(m![1]);
    expect(breadcrumb).toEqual([
      { label: "Developers Hub", href: "/developers-hub" },
      { label: "Onchain Tools", href: "/developers-hub/onchain-tools" },
      { label: "Oracles", href: "/developers-hub/onchain-tools/oracles" },
    ]);
  });

  it("includes subtitle prop in the JSX when present in source frontmatter", () => {
    const subtitle = "The core minting and redemption mechanism";
    const input = `---\ntitle: Stabilizer\nsubtitle: ${JSON.stringify(subtitle)}\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/products/how-it-works/stabilizer-module"),
    ) as string;

    // Subtitle is emitted as a JSX expression: subtitle={"..."}
    expect(out).toContain(`subtitle={${JSON.stringify(subtitle)}}`);
  });

  it("omits the subtitle prop when no subtitle is in source frontmatter", () => {
    const input = `---\ntitle: Stabilizer\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/products/how-it-works/stabilizer-module"),
    ) as string;

    expect(out).not.toContain("subtitle=");
    expect(out).toContain("<PageHeader breadcrumb=");
  });

  it("omits the subtitle prop when subtitle is empty/whitespace", () => {
    const input = `---\ntitle: Stabilizer\nsubtitle: "   "\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/products/how-it-works/stabilizer-module"),
    ) as string;

    expect(out).not.toContain("subtitle=");
  });

  it("applies LABEL_OVERRIDES (eusd → eUSD, redstone → RedStone)", () => {
    const input = `---\ntitle: Page\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/developers-hub/addresses/eusd/ethereum"),
    ) as string;

    const m = out.match(/breadcrumb=\{(\[[^\]]*\])\}/);
    const breadcrumb = JSON.parse(m![1]);
    const labels = breadcrumb.map((b: { label: string }) => b.label);
    expect(labels).toContain("eUSD");
    expect(labels).toContain("Developers Hub");
    expect(labels).toContain("Addresses");
  });

  it("renders RedStone label override", () => {
    const input = `---\ntitle: X\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/redstone/foo"),
    ) as string;
    const m = out.match(/breadcrumb=\{(\[[^\]]*\])\}/);
    const breadcrumb = JSON.parse(m![1]);
    expect(breadcrumb[0].label).toBe("RedStone");
  });

  it("places the import at the very top of the body, then the JSX", () => {
    const input = `---\ntitle: Page\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/introduction/product"),
    ) as string;

    const parsed = matter(out);
    const body = parsed.content;
    const importIdx = body.indexOf(
      `import { PageHeader } from '@/components/PageHeader'`,
    );
    const jsxIdx = body.indexOf("<PageHeader breadcrumb=");
    const h1Idx = body.indexOf("# Stabilizer Module");

    expect(importIdx).toBeGreaterThanOrEqual(0);
    expect(jsxIdx).toBeGreaterThan(importIdx);
    expect(h1Idx).toBeGreaterThan(jsxIdx);
  });

  it("preserves frontmatter (title + subtitle) in the output", () => {
    const input = `---\ntitle: Foo\nsubtitle: Bar baz\ndescription: Hello\n---\n\nBody.\n`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/foo/page"),
    ) as string;

    const parsed = matter(out);
    expect(parsed.data.title).toBe("Foo");
    expect(parsed.data.subtitle).toBe("Bar baz");
    expect(parsed.data.description).toBe("Hello");
  });

  it("emits a no-op for the root path even when there is no frontmatter", () => {
    const input = "Plain body, no frontmatter.\n";
    const out = pageHeader.apply(input, ctx("https://docs.eusd.xyz/")) as string;
    expect(out).toBe(input);
  });

  it("renders breadcrumb as valid JSON array of {label, href}", () => {
    const input = `---\ntitle: Page\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.eusd.xyz/security/audits"),
    ) as string;
    const m = out.match(/breadcrumb=\{(\[[^\]]*\])\}/);
    expect(m).not.toBeNull();
    const breadcrumb = JSON.parse(m![1]);
    expect(Array.isArray(breadcrumb)).toBe(true);
    for (const item of breadcrumb) {
      expect(typeof item.label).toBe("string");
      expect(typeof item.href).toBe("string");
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("drops href on segments not present in validRoutes", () => {
    const input = `---\ntitle: Bridging Module\n---\n\n${PLAIN_BODY}`;
    // /products has no index.mdx, but /products/parallel-v3 and /products/parallel-v3/how-it-works do.
    const validRoutes = new Set([
      "/products/parallel-v3",
      "/products/parallel-v3/how-it-works",
      "/products/parallel-v3/how-it-works/bridging-module",
    ]);
    const out = pageHeader.apply(
      input,
      ctx(
        "https://docs.parallel.best/products/parallel-v3/how-it-works/bridging-module",
        validRoutes,
      ),
    ) as string;

    const m = out.match(/breadcrumb=\{(\[.*?\])\}/);
    expect(m).not.toBeNull();
    const breadcrumb = JSON.parse(m![1]);
    expect(breadcrumb).toEqual([
      { label: "Products" }, // no href — /products is a 404
      { label: "Parallel V3", href: "/products/parallel-v3" },
      { label: "How It Works", href: "/products/parallel-v3/how-it-works" },
    ]);
  });

  it("emits all hrefs when validRoutes is undefined (legacy fallback)", () => {
    const input = `---\ntitle: Page\n---\n\n${PLAIN_BODY}`;
    const out = pageHeader.apply(
      input,
      ctx("https://docs.parallel.best/security/audits"),
    ) as string;
    const m = out.match(/breadcrumb=\{(\[.*?\])\}/);
    const breadcrumb = JSON.parse(m![1]);
    expect(breadcrumb).toEqual([{ label: "Security", href: "/security" }]);
  });

  it("exposes its name", () => {
    expect(pageHeader.name).toBe("pageHeader");
  });
});
