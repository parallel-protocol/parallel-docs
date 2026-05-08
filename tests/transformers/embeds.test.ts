import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEmbedMetaCache } from "../../scripts/crawler/embedMeta";
import { embeds } from "../../scripts/crawler/transformers/embeds";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

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

function mockFetchHtml(html: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(html, { headers: { "Content-Type": "text/html" } }),
    ),
  );
}

describe("embeds", () => {
  beforeEach(() => {
    __resetEmbedMetaCache();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetEmbedMetaCache();
  });

  it("converts a self-closing {% embed url %} to <LinkCard ... /> with fetched meta", async () => {
    mockFetchHtml(
      `<head>
        <meta property="og:title" content="Parallel Bug Bounties | Immunefi">
        <link rel="apple-touch-icon" href="/icon.png">
      </head>`,
    );
    const input =
      '{% embed url="https://immunefi.com/bug-bounty/parallel/information/" %}';
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toContain('<LinkCard ');
    expect(out).toContain(
      'href="https://immunefi.com/bug-bounty/parallel/information/"',
    );
    expect(out).toContain('title="Parallel Bug Bounties | Immunefi"');
    // /icon.png is root-absolute → resolves against origin
    expect(out).toContain('favicon="https://immunefi.com/icon.png"');
    expect(out).toContain('hostname="immunefi"');
    expect(out).toContain(`import { LinkCard } from '@/components/LinkCard'`);
  });

  it("strips leaked autolink <> wrapping the URL value", async () => {
    mockFetchHtml(`<title>Some Page</title>`);
    const input =
      '{% embed url="<https://immunefi.com/bug-bounty/parallel/information/>" %}';
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toContain(
      'href="https://immunefi.com/bug-bounty/parallel/information/"',
    );
    expect(out).not.toContain("<https:");
    expect(out).not.toContain('href="<');
  });

  it("forces title from the body when block embed has body content", async () => {
    mockFetchHtml(`<meta property="og:title" content="Should Be Overridden">`);
    const input =
      '{% embed url="https://x.com/hello" %}custom text{% endembed %}';
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toContain('title="custom text"');
    expect(out).not.toContain("Should Be Overridden");
  });

  it("uses fetched og:title when block body is empty", async () => {
    mockFetchHtml(`<meta property="og:title" content="From OG">`);
    const input = '{% embed url="https://x.com" %}  {% endembed %}';
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toContain('title="From OG"');
  });

  it("handles multiple embeds in one document with a single import", async () => {
    mockFetchHtml(`<meta property="og:title" content="Generic">`);
    const input = [
      "First:",
      '{% embed url="https://a.com" %}',
      "Then:",
      '{% embed url="https://b.com" %}',
    ].join("\n");
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toContain('href="https://a.com"');
    expect(out).toContain('href="https://b.com"');
    const importMatches = out.match(/import \{ LinkCard \}/g);
    expect(importMatches?.length).toBe(1);
  });

  it("returns source unchanged for content without embeds (no import injected, no fetch)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const input = "# Plain page\n\nNo embed here.";
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toBe(input);
    expect(out).not.toContain("LinkCard");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("escapes & and \" in href and title attrs", async () => {
    mockFetchHtml(`<meta property="og:title" content='Quoted &quot;title&quot;'>`);
    const input = '{% embed url="https://example.com/?a=1&b=2" %}';
    const out = (await embeds.apply(input, ctx)) as string;
    expect(out).toContain('href="https://example.com/?a=1&amp;b=2"');
    // og:title contained literal &quot; → after entity decode in extractTitle
    // → re-escaped here as &quot;
    expect(out).toMatch(/title="[^"]*&quot;[^"]*"/);
  });

  it("falls back gracefully on fetch failure (still produces a card)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const input = '{% embed url="https://broken.example.com/" %}';
    const out = (await embeds.apply(input, ctx)) as string;
    // No favicon (empty string → omitted), title falls back to hostname
    expect(out).toContain('<LinkCard ');
    expect(out).toContain('href="https://broken.example.com/"');
    expect(out).toContain('title="broken.example"');
    expect(out).not.toContain('favicon=""');
    warn.mockRestore();
  });

  it("exposes its name", () => {
    expect(embeds.name).toBe("embeds");
  });
});
