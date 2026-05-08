import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { __clearAliasCache, internalLinks } from "../../scripts/crawler/transformers/internalLinks";

const fixturesDir = resolve(__dirname, "../fixtures");

function makeCtx(url: string) {
  return {
    url,
    outputPath: "docs/pages/test.mdx",
    imagesDir: "docs/public/images",
    cache: new Map() as any,
  };
}

describe("internalLinks", () => {
  const input = readFileSync(resolve(fixturesDir, "with-internal-links.md"), "utf-8");

  it("strips .md from absolute internal links", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/products/foo"))) as string;
    expect(out).toContain("[Audits](/security/audits)");
    expect(out).not.toContain("/security/audits.md");
  });

  it("preserves anchor when stripping .md", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/products/foo"))) as string;
    expect(out).toContain("[PoS](/security/proof-of-solvency#methodology)");
  });

  it("resolves relative .md links to absolute Vocs routes", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/products/foo"))) as string;
    expect(out).toContain("[Sibling](/products/sibling)");
  });

  it("resolves relative parent links", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/products/foo"))) as string;
    expect(out).toContain("[Root](/root)");
  });

  it("does not touch anchor-only links", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/"))) as string;
    expect(out).toContain("[Top](#top)");
  });

  it("does not touch external links", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/"))) as string;
    expect(out).toContain("[Vocs](https://vocs.dev)");
  });

  it("does not touch /files/ links (handled by images transformer)", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/"))) as string;
    expect(out).toContain("[Diagram](/files/abc123)");
  });

  it("does not touch mailto links", async () => {
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/"))) as string;
    expect(out).toContain("[Contact](mailto:hello@example.com)");
  });

  it("is idempotent", async () => {
    const ctx = makeCtx("https://docs.parallel.best/products/foo");
    const once = (await internalLinks.apply(input, ctx)) as string;
    const twice = (await internalLinks.apply(once, ctx)) as string;
    expect(twice).toBe(once);
  });

  it("exposes its name", () => {
    expect(internalLinks.name).toBe("internalLinks");
  });
});

describe("internalLinks /pages/[hash] alias resolution", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __clearAliasCache();
    fetchMock = vi.fn(async (url: string, opts: RequestInit) => {
      if (opts?.method !== "HEAD") throw new Error("Expected HEAD");
      if (url.endsWith("/pages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")) {
        return new Response(null, {
          status: 302,
          headers: { Location: "https://docs.parallel.best/products/parallelizer" },
        });
      }
      if (url.endsWith("/pages/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")) {
        return new Response(null, {
          status: 301,
          headers: { Location: "/security/audits" },
        });
      }
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves /pages/[hash] to the redirected pathname", async () => {
    const input = '<a href="/pages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">link</a>';
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/x"))) as string;
    expect(out).toContain('href="/products/parallelizer"');
    expect(out).not.toContain("/pages/");
  });

  it("handles relative Location headers", async () => {
    const input = '<a href="/pages/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb">link</a>';
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/x"))) as string;
    expect(out).toContain('href="/security/audits"');
  });

  it("leaves alias as-is when HEAD returns 404 (no Location)", async () => {
    const hash = "f".repeat(40);
    const input = `<a href="/pages/${hash}">link</a>`;
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/x"))) as string;
    expect(out).toContain(`/pages/${hash}`);
  });

  it("caches resolution: 2 occurrences of same hash → 1 HEAD fetch", async () => {
    const hash = "a".repeat(40);
    const input = `<a href="/pages/${hash}">A</a> <a href="/pages/${hash}">B</a>`;
    await internalLinks.apply(input, makeCtx("https://docs.parallel.best/x"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not match short aliases (< 16 chars)", async () => {
    // Short slugs like /pages/short or /pages/abc123 are not GitBook page IDs
    const input = '<a href="/pages/short">x</a> <a href="/pages/abc123">y</a>';
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/x"))) as string;
    expect(out).toContain("/pages/short");
    expect(out).toContain("/pages/abc123");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves GitBook alphanumeric alias from KNOWN_ALIASES without fetching", async () => {
    // vmL3haFUBR6HbqbS6PLs is the "Discover USDp" button alias in introduction/products.mdx
    const input = '<a href="/pages/vmL3haFUBR6HbqbS6PLs">Discover USDp</a>';
    const out = (await internalLinks.apply(input, makeCtx("https://docs.parallel.best/x"))) as string;
    expect(out).toContain('href="/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp"');
    expect(out).not.toContain("/pages/vmL3haFUBR6HbqbS6PLs");
    expect(fetchMock).not.toHaveBeenCalled(); // KNOWN_ALIASES lookup — no network call needed
  });

  it("drops the link wrapper for [text](broken://pages/HASH) — keeps text only", async () => {
    const input =
      "See [paUSD Risk Parameters](broken://pages/rqx6kqeym5jrdmwd0mj2) for details.";
    const out = (await internalLinks.apply(
      input,
      makeCtx("https://docs.parallel.best/x"),
    )) as string;
    expect(out).toBe("See paUSD Risk Parameters for details.");
  });

  it("drops the link wrapper for any broken:// URL, not just /pages/", async () => {
    const input = "Check [Foo](broken://anything-else).";
    const out = (await internalLinks.apply(
      input,
      makeCtx("https://docs.parallel.best/x"),
    )) as string;
    expect(out).toBe("Check Foo.");
  });

  it("does NOT touch real https external links when checking for broken://", async () => {
    const input = "Visit [Vocs](https://vocs.dev).";
    const out = (await internalLinks.apply(
      input,
      makeCtx("https://docs.parallel.best/x"),
    )) as string;
    expect(out).toContain("[Vocs](https://vocs.dev)");
  });
});
