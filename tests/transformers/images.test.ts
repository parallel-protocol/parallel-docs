import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { images } from "../../scripts/crawler/transformers/images";

const fixturesDir = resolve(__dirname, "../fixtures");
const PAGE_URL = "https://docs.eusd.xyz/products/how-it-works/stabilizer-module";

class InMemoryCache {
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

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}
function jpegBytes() {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
}

/**
 * Construit un HTML de page rendue avec N <img data-testid="zoom-image"> dans
 * l'ordre + des distractions UI (logo, icon) qui ne doivent PAS être matchées.
 * `subtitle` (si non vide) est rendu comme le <p class="text-lg text-tint clear-both">.
 */
function makeHtml(imageProxyUrls: string[], subtitle = ""): string {
  const distractions = `
    <img alt="logo" src="https://example.com/logo.svg">
    <img alt="favicon" src="https://example.com/favicon.png">
  `;
  const subtitleHtml = subtitle
    ? `<p class="text-lg text-tint clear-both">${subtitle}</p>`
    : "";
  const content = imageProxyUrls
    .map((u, i) => {
      const escaped = u.replace(/&/g, "&amp;");
      // Alterne ordre des attributs pour tester le regex robuste.
      return i % 2 === 0
        ? `<img data-testid="zoom-image" alt="img${i}" src="${escaped}">`
        : `<img alt="img${i}" src="${escaped}" data-testid="zoom-image">`;
    })
    .join("\n");
  return `<html><body>${distractions}\n${subtitleHtml}\n${content}</body></html>`;
}

describe("images", () => {
  let imagesDir: string;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    imagesDir = mkdtempSync(join(tmpdir(), "images-test-"));
  });

  afterEach(() => {
    rmSync(imagesDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  function makeCtx(cache = new InMemoryCache()) {
    return {
      url: PAGE_URL,
      outputPath: "docs/pages/products/how-it-works/stabilizer-module.mdx",
      imagesDir,
      // biome-ignore lint/suspicious/noExplicitAny: test cache stub
      cache: cache as any,
    };
  }

  function setupFetch(handlers: {
    htmlImageUrls: string[];
    subtitle?: string;
    binary?: Record<string, { bytes: Uint8Array; contentType: string }>;
    binaryFallback?: { bytes: Uint8Array; contentType: string };
  }) {
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        return new Response(
          makeHtml(handlers.htmlImageUrls, handlers.subtitle ?? ""),
          {
            headers: { "Content-Type": "text/html" },
          },
        );
      }
      const cfg = handlers.binary?.[url] ?? handlers.binaryFallback;
      if (cfg) {
        // Cast Uint8Array → BodyInit (Node 25 + lib.dom strict types)
        return new Response(cfg.bytes as BodyInit, {
          headers: { "Content-Type": cfg.contentType },
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  }

  it("downloads via HTML proxy URLs and rewrites all 3 patterns (markdown, <img>, <figure><img>)", async () => {
    const proxyA = "https://docs.eusd.xyz/~gitbook/image?url=blob1&sign=A&sv=2";
    const proxyB = "https://docs.eusd.xyz/~gitbook/image?url=blob2&sign=B&sv=2";
    const proxyC = "https://docs.eusd.xyz/~gitbook/image?url=blob3&sign=C&sv=2";
    setupFetch({
      htmlImageUrls: [proxyA, proxyB, proxyC],
      binary: {
        [proxyA]: { bytes: pngBytes(), contentType: "image/png" },
        [proxyB]: { bytes: jpegBytes(), contentType: "image/jpeg" },
        [proxyC]: { bytes: pngBytes(), contentType: "image/png" },
      },
    });

    const input = readFileSync(resolve(fixturesDir, "with-figures.md"), "utf-8");
    const out = await images.apply(input, makeCtx());

    expect(out).toContain("/images/aaa111.png");
    expect(out).toContain("/images/bbb222.jpg");
    expect(out).toContain("/images/ccc333.png");
    expect(out).not.toMatch(/\/files\/(aaa111|bbb222|ccc333)/);

    expect(existsSync(join(imagesDir, "aaa111.png"))).toBe(true);
    expect(existsSync(join(imagesDir, "bbb222.jpg"))).toBe(true);
    expect(existsSync(join(imagesDir, "ccc333.png"))).toBe(true);

    // 1 fetch HTML + 3 fetch images = 4
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("skips download when hash is already in cache (HTML still fetched once)", async () => {
    const cache = new InMemoryCache();
    cache.set("aaa111", "aaa111.png");
    setupFetch({
      htmlImageUrls: ["https://cdn.example.com/x"],
      binaryFallback: { bytes: pngBytes(), contentType: "image/png" },
    });

    const input = "Reference: ![](/files/aaa111).";
    const out = await images.apply(input, makeCtx(cache));

    expect(out).toContain("/images/aaa111.png");
    // HTML est tout de même fetched (need URL list pour validation count). C'est acceptable.
    // Vérifier au moins que l'image n'a pas été re-downloadée.
    const imageFetchCount = fetchMock.mock.calls.filter(
      (c) => c[0] !== PAGE_URL,
    ).length;
    expect(imageFetchCount).toBe(0);
  });

  it("still fetches HTML to extract subtitle when no /files/ refs are present", async () => {
    setupFetch({ htmlImageUrls: [], subtitle: "" });
    const input = "No images here. Just text.";
    const out = await images.apply(input, makeCtx());
    expect(out).toBe(input);
    // Une seule fetch (HTML), pas d'images
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(PAGE_URL);
  });

  it("does not touch already-converted /images/ paths but still fetches HTML", async () => {
    setupFetch({ htmlImageUrls: [], subtitle: "" });
    const input = "Already: ![](/images/ddd444.png).";
    const out = await images.apply(input, makeCtx());
    expect(out).toBe(input);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("warns and skips rewrite when HTML count != markdown count", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setupFetch({
      htmlImageUrls: ["https://cdn.example.com/only-one"],
      binaryFallback: { bytes: pngBytes(), contentType: "image/png" },
    });

    const input = "![a](/files/aaa111) ![b](/files/bbb222)";
    const out = await images.apply(input, makeCtx());

    expect(out).toBe(input); // pas réécrit
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/count mismatch \(2 markdown imgs vs 1 HTML/),
    );
    warn.mockRestore();
  });

  it("warns and skips a hash when fetched URL returns non-image Content-Type (signed URL expired)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const proxyA = "https://cdn.example.com/expired";
    setupFetch({
      htmlImageUrls: [proxyA],
      binary: {
        [proxyA]: {
          bytes: new TextEncoder().encode("<html>404</html>"),
          contentType: "text/html",
        },
      },
    });

    const input = "![alt](/files/aaa111)";
    const out = await images.apply(input, makeCtx());

    // Hash unmapped → /files/ ref préservée
    expect(out).toContain("/files/aaa111");
    expect(out).not.toContain("/images/");
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/unexpected content-type/),
    );
    warn.mockRestore();
  });

  it("warns and skips when image fetch returns non-2xx", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const proxyA = "https://cdn.example.com/notfound";
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        return new Response(makeHtml([proxyA]), {
          headers: { "Content-Type": "text/html" },
        });
      }
      if (url === proxyA) {
        return new Response("not found", { status: 404 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const input = "![alt](/files/aaa111)";
    const out = await images.apply(input, makeCtx());

    expect(out).toContain("/files/aaa111");
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/HTTP 404/));
    warn.mockRestore();
  });

  it("decodes HTML entities (&amp;) in extracted URLs", async () => {
    const escapedUrl = "https://cdn.example.com/x?a=1&b=2";
    setupFetch({
      htmlImageUrls: [escapedUrl],
      binaryFallback: { bytes: pngBytes(), contentType: "image/png" },
    });

    const input = "![alt](/files/aaa111)";
    await images.apply(input, makeCtx());

    // Vérifie que fetch a reçu l'URL décodée
    const imageFetchCalls = fetchMock.mock.calls.filter((c) => c[0] !== PAGE_URL);
    expect(imageFetchCalls[0][0]).toBe(escapedUrl); // pas de &amp;
  });

  it("extracts subtitle from <p class='text-lg text-tint clear-both'> and injects it into source frontmatter", async () => {
    const subtitle = "The core minting and redemption mechanism";
    setupFetch({ htmlImageUrls: [], subtitle });

    const input = "# My Page\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    const parsed = matter(out);
    expect(parsed.data.subtitle).toBe(subtitle);
    expect(parsed.content.trim()).toBe("# My Page\n\nBody.".trim());
  });

  it("preserves existing source frontmatter when injecting subtitle", async () => {
    setupFetch({ htmlImageUrls: [], subtitle: "Hello there" });

    const input = "---\nfoo: bar\n---\n\n# Title\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    const parsed = matter(out);
    expect(parsed.data.foo).toBe("bar");
    expect(parsed.data.subtitle).toBe("Hello there");
  });

  it("does NOT inject a subtitle key when no matching <p> is in the HTML", async () => {
    setupFetch({ htmlImageUrls: [], subtitle: "" });

    const input = "# Title\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    const parsed = matter(out);
    expect(parsed.data.subtitle).toBeUndefined();
  });

  it("matches a <p> with class attributes in any order (tint first, then text-lg, then clear-both)", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        return new Response(
          `<html><body><p class="text-tint mb-2 text-lg clear-both">Reordered subtitle</p></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const input = "# T\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    expect(matter(out).data.subtitle).toBe("Reordered subtitle");
  });

  it("ignores <p> tags that do not have ALL three required classes", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        // Missing clear-both
        return new Response(
          `<html><body><p class="text-lg text-tint">Not a subtitle</p></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const input = "# T\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    expect(matter(out).data.subtitle).toBeUndefined();
  });

  it("trims whitespace and decodes HTML entities in the subtitle", async () => {
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        return new Response(
          `<html><body><p class="text-lg text-tint clear-both">  AT&amp;T &lt;3  </p></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const input = "# T\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    expect(matter(out).data.subtitle).toBe("AT&T <3");
  });

  it("returns source unchanged when HTML fetch fails (no subtitle injected)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock = vi.fn(async (url: string) => {
      if (url === PAGE_URL) {
        return new Response("server error", { status: 500 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const input = "# T\n\nBody.\n";
    const out = await images.apply(input, makeCtx());

    expect(out).toBe(input);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Failed to fetch HTML/));
    warn.mockRestore();
  });

  it("exposes its name", () => {
    expect(images.name).toBe("images");
  });
});
