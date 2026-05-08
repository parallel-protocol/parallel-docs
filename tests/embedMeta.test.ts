import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetEmbedMetaCache,
  extractTitle,
  fetchEmbedMeta,
  flushEmbedMetaCache,
  initEmbedMetaCache,
  pickFavicon,
  shortHostname,
} from "../scripts/crawler/embedMeta";

describe("shortHostname", () => {
  it("strips the TLD and www. prefix", () => {
    expect(shortHostname("https://immunefi.com/foo")).toBe("immunefi");
    expect(shortHostname("https://www.example.com/")).toBe("example");
  });

  it("keeps subdomains (gov.parallel.best → gov.parallel)", () => {
    expect(shortHostname("https://gov.parallel.best/t/123")).toBe("gov.parallel");
  });

  it("returns the raw URL when parsing fails", () => {
    expect(shortHostname("not-a-url")).toBe("not-a-url");
  });

  it("handles single-label hosts (localhost)", () => {
    expect(shortHostname("http://localhost:3000/")).toBe("localhost");
  });
});

describe("extractTitle", () => {
  it("prefers og:title over <title>", () => {
    const html = `<head><title>Fallback</title><meta property="og:title" content="Real Title"></head>`;
    expect(extractTitle(html)).toBe("Real Title");
  });

  it("matches og:title in either attribute order", () => {
    const html = `<meta content="OG First" property="og:title">`;
    expect(extractTitle(html)).toBe("OG First");
  });

  it("falls back to twitter:title when og:title is missing", () => {
    const html = `<title>X</title><meta name="twitter:title" content="Tweet Title">`;
    expect(extractTitle(html)).toBe("Tweet Title");
  });

  it("falls back to <title> when neither meta is present", () => {
    const html = `<head><title>Just A Title</title></head>`;
    expect(extractTitle(html)).toBe("Just A Title");
  });

  it("decodes HTML entities", () => {
    const html = `<meta property="og:title" content="AT&amp;T &lt;3">`;
    expect(extractTitle(html)).toBe("AT&T <3");
  });

  it("returns null when no title is found", () => {
    expect(extractTitle("<html><body>No title</body></html>")).toBeNull();
  });
});

describe("pickFavicon", () => {
  const baseUrl = "https://immunefi.com/bug-bounty/parallel/information/";

  it("prefers apple-touch-icon over other links", () => {
    const html = `
      <link rel="icon" href="/favicon.ico">
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    `;
    expect(pickFavicon(html, baseUrl)).toBe("https://immunefi.com/apple-touch-icon.png");
  });

  it("prefers icon[type=image/png] when no apple-touch-icon", () => {
    const html = `
      <link rel="icon" href="/favicon.ico">
      <link rel="icon" type="image/png" href="/icon-32.png">
    `;
    expect(pickFavicon(html, baseUrl)).toBe("https://immunefi.com/icon-32.png");
  });

  it("falls back to /favicon.ico when no <link> is present", () => {
    expect(pickFavicon("<html></html>", baseUrl)).toBe("https://immunefi.com/favicon.ico");
  });

  it("resolves relative hrefs against the page URL (not just origin)", () => {
    const html = `<link rel="apple-touch-icon" href="icons/apple.png">`;
    expect(pickFavicon(html, baseUrl)).toBe(
      "https://immunefi.com/bug-bounty/parallel/information/icons/apple.png",
    );
  });

  it("preserves absolute hrefs", () => {
    const html = `<link rel="apple-touch-icon" href="https://cdn.example.com/icon.png">`;
    expect(pickFavicon(html, baseUrl)).toBe("https://cdn.example.com/icon.png");
  });
});

describe("fetchEmbedMeta — with mocked fetch", () => {
  beforeEach(() => {
    __resetEmbedMetaCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    __resetEmbedMetaCache();
  });

  it("fetches the URL and returns title + favicon + hostname (root-absolute href)", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        `<head>
          <title>Fallback</title>
          <meta property="og:title" content="Parallel Bug Bounties | Immunefi">
          <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        </head>`,
        { headers: { "Content-Type": "text/html" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const meta = await fetchEmbedMeta(
      "https://immunefi.com/bug-bounty/parallel/information/",
    );
    expect(meta.title).toBe("Parallel Bug Bounties | Immunefi");
    // /apple-touch-icon.png starts with `/` → resolves against origin, not the
    // page URL. Both behaviors are valid HTML, the helper handles both.
    expect(meta.favicon).toBe("https://immunefi.com/apple-touch-icon.png");
    expect(meta.hostname).toBe("immunefi");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a graceful fallback when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const meta = await fetchEmbedMeta("https://broken.example.com/x");
    expect(meta.title).toBe("broken.example");
    expect(meta.favicon).toBe("");
    expect(meta.hostname).toBe("broken.example");
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/embedMeta/));
    warn.mockRestore();
  });

  it("returns a graceful fallback on non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const meta = await fetchEmbedMeta("https://example.com/missing");
    expect(meta.title).toBe("example");
    expect(meta.favicon).toBe("");
    warn.mockRestore();
  });

  it("returns a graceful fallback on non-html response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", { headers: { "Content-Type": "application/json" } }),
      ),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const meta = await fetchEmbedMeta("https://example.com/api");
    expect(meta.favicon).toBe("");
    warn.mockRestore();
  });
});

describe("fetchEmbedMeta — disk cache", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "embed-cache-test-"));
    __resetEmbedMetaCache();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    __resetEmbedMetaCache();
  });

  it("uses the cached entry on a second call (no second fetch)", async () => {
    const cachePath = join(dir, "embed-cache.json");
    await initEmbedMetaCache(cachePath);

    const fetchMock = vi.fn(async () =>
      new Response(
        `<meta property="og:title" content="Cached Title">`,
        { headers: { "Content-Type": "text/html" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchEmbedMeta("https://example.com/cached");
    await fetchEmbedMeta("https://example.com/cached");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("persists the cache to disk via flushEmbedMetaCache", async () => {
    const cachePath = join(dir, "embed-cache.json");
    await initEmbedMetaCache(cachePath);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<meta property="og:title" content="Persistable">`,
          { headers: { "Content-Type": "text/html" } },
        ),
      ),
    );

    await fetchEmbedMeta("https://example.com/persist");
    await flushEmbedMetaCache();

    const written = JSON.parse(readFileSync(cachePath, "utf-8"));
    expect(written["https://example.com/persist"].title).toBe("Persistable");
    expect(written["https://example.com/persist"].fetchedAt).toBeTypeOf("number");
  });
});
