import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPipeline } from "../../scripts/crawler/pipeline";
import { frontmatter } from "../../scripts/crawler/transformers/frontmatter";
import { hashtagHeadings } from "../../scripts/crawler/transformers/hashtagHeadings";
import { hints } from "../../scripts/crawler/transformers/hints";
import { images } from "../../scripts/crawler/transformers/images";
import { internalLinks } from "../../scripts/crawler/transformers/internalLinks";
import { stripFooter } from "../../scripts/crawler/transformers/stripFooter";
import { tabs } from "../../scripts/crawler/transformers/tabs";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

class InMemoryCache implements ImageCache {
  private map = new Map<string, string>();
  has(k: string) {
    return this.map.has(k);
  }
  get(k: string) {
    return this.map.get(k);
  }
  set(k: string, v: string) {
    this.map.set(k, v);
  }
}

const PIPELINE = [
  stripFooter,
  hashtagHeadings,
  internalLinks,
  hints,
  tabs,
  images,
  frontmatter,
];

describe("pipeline integration — Stabilizer Module fixture", () => {
  let imagesDir: string;
  let fetchMock: ReturnType<typeof vi.fn>;

  const PAGE_URL =
    "https://docs.eusd.xyz/products/how-it-works/stabilizer-module";
  const PROXY_A = "https://docs.eusd.xyz/~gitbook/image?url=blob1&sign=A&sv=2";
  const PROXY_B = "https://docs.eusd.xyz/~gitbook/image?url=blob2&sign=B&sv=2";
  const PROXY_C = "https://docs.eusd.xyz/~gitbook/image?url=blob3&sign=C&sv=2";

  function makeRenderedHtml() {
    // 3 zoom-images dans l'ordre + 1 distraction logo
    return `<html><body>
      <img alt="logo" src="https://example.com/logo.svg">
      <img data-testid="zoom-image" alt="Diagram alpha" src="${PROXY_A.replace(/&/g, "&amp;")}">
      <img alt="img2" src="${PROXY_B.replace(/&/g, "&amp;")}" data-testid="zoom-image">
      <img data-testid="zoom-image" alt="" src="${PROXY_C.replace(/&/g, "&amp;")}">
    </body></html>`;
  }

  beforeEach(() => {
    imagesDir = mkdtempSync(join(tmpdir(), "pipeline-int-"));
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        return new Response(makeRenderedHtml(), {
          headers: { "Content-Type": "text/html" },
        });
      }
      if (url === PROXY_A || url === PROXY_B || url === PROXY_C) {
        return new Response(png, { headers: { "Content-Type": "image/png" } });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    rmSync(imagesDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it("transforms a realistic GitBook page through all transformers in order", async () => {
    const fixture = readFileSync(
      resolve(__dirname, "../fixtures/integration/stabilizer-module.md"),
      "utf-8",
    );
    const ctx: TransformContext = {
      url: "https://docs.eusd.xyz/products/how-it-works/stabilizer-module",
      outputPath:
        "docs/pages/products/how-it-works/stabilizer-module.mdx",
      imagesDir,
      cache: new InMemoryCache(),
    };

    const out = await runPipeline(fixture, ctx, PIPELINE);

    // Frontmatter extraction
    const parsed = matter(out);
    expect(parsed.data.title).toBe("Stabilizer Module");
    expect(parsed.data.description).toMatch(/core mechanism of eUSD/);
    expect(parsed.data.description.length).toBeLessThanOrEqual(160);

    // H1 stripped from body
    expect(parsed.content).not.toMatch(/^# Stabilizer Module/m);

    // Footer stripped
    expect(out).not.toContain("Agent Instructions");
    expect(out).not.toContain("AI assistant");

    // No more /files/ refs (all converted to /images/)
    expect(out).not.toMatch(/\/files\/(aaa111|bbb222|ccc333)/);
    expect(out).toContain("/images/aaa111.png");
    expect(out).toContain("/images/bbb222.png");
    expect(out).toContain("/images/ccc333.png");

    // Hashtag pictos stripped from H2/H3
    expect(out).not.toMatch(/^## #️⃣/m);
    expect(out).not.toMatch(/^### #️⃣/m);
    expect(out).toMatch(/^## Architecture/m);
    expect(out).toMatch(/^### Mint flow/m);

    // Internal .md links stripped (absolute and relative resolved)
    expect(out).toContain("[audits report](/security/audits)");
    expect(out).toContain(
      "[Implementation](/products/how-it-works/implementation)",
    );

    // External links untouched
    expect(out).toContain("[Vocs docs](https://vocs.dev)");

    // Code blocks preserved verbatim
    expect(out).toContain("Code blocks are preserved verbatim.");

    // Image binaries actually written to imagesDir
    expect(existsSync(join(imagesDir, "aaa111.png"))).toBe(true);
    expect(existsSync(join(imagesDir, "bbb222.png"))).toBe(true);
    expect(existsSync(join(imagesDir, "ccc333.png"))).toBe(true);

    // 1 HTML page fetch + 3 image fetches (1 per unique hash) = 4
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
