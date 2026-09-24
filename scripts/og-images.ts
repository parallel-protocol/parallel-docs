#!/usr/bin/env tsx
/**
 * Post-build step — one Open Graph image per page, after `postbuild-seo.ts`.
 *
 * The dApp (app.parallel.best) gives every page its own share card through
 * Next's `opengraph-image` convention: the "pillars" scene, the page title in
 * PP Editorial New, the page URL under it, the description at the bottom and
 * the Parallel symbol top right. Vocs has no such hook, so the same card is
 * rendered here at build time with the engine Next uses underneath
 * (`next/og` → satori), composited over the scene with sharp, and written to
 * `og/<route>.jpg` next to the page. Each page's `og:image` / `twitter:image`
 * is then pointed at its own card; Vocs' static `og-image.png` stays the
 * default for anything this step does not reach.
 *
 * Inputs come from the built HTML itself — the `og:title` and
 * `og:description` Vocs wrote, and the canonical `postbuild-seo.ts` injected —
 * so a card always says what the page's own tags say, and only real page
 * routes (the ones with a canonical) get one.
 *
 * The display face is PP Editorial New, a commercial font, and this repository
 * is public: the font file must never be committed here. It is fetched at
 * build time from brand.parallel.best, which already serves it as a web font,
 * and decompressed in memory (satori reads TTF/OTF/WOFF, not WOFF2). If that
 * fetch fails, the build still succeeds: the step logs a warning and every
 * page keeps the static image.
 *
 * Like `postbuild-seo.ts`, re-running it over an already-processed build is a
 * no-op: the tags it owns are stripped before they are written again.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import satori from "satori";
import sharp from "sharp";
import wawoff2 from "wawoff2";

import { PRODUCTION_ORIGIN } from "../site.config";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "scripts/og");
const OUTPUT_DIRS = [join(ROOT, "dist/public"), join(ROOT, ".vercel/output/static")];

export const WIDTH = 1200;
export const HEIGHT = 630;

/** PP Editorial New Ultralight, as brand.parallel.best serves it. */
const DISPLAY_FONT_URL = "https://brand.parallel.best/fonts/PPEditorialNew-Ultralight.woff2";
const SANS_FONT = join(
  ROOT,
  "node_modules/@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff",
);

// ---------------------------------------------------------------------------
// Pure helpers (unit tested).
// ---------------------------------------------------------------------------

/** Where a route's card is served: `/` → `og/index.jpg`, `/a/b` → `og/a/b.jpg`. */
export function ogImagePath(route: string): string {
  const slug = route === "/" ? "index" : route.replace(/^\/+|\/+$/g, "");
  return `og/${slug}.jpg`;
}

/** The URL line under the title: `docs.parallel.best/a/b`, no scheme. */
export function urlLabel(route: string, origin = PRODUCTION_ORIGIN): string {
  const host = origin.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return route === "/" ? host : `${host}${route}`;
}

/** The text of a tag attribute as a person reads it. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** For writing text back into an attribute. */
export function escapeAttribute(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Cuts at the last word boundary within `max` characters and adds an ellipsis. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/**
 * The title as the card shows it. Some pages carry their section after an em
 * dash ("PRL Bridging Module Specifications — Governance") to tell them apart
 * in search results; on the card the URL line already says where the page
 * lives, so the suffix goes.
 */
export function cardTitle(title: string): string {
  const parts = title.split(" — ");
  return (parts.length > 1 ? parts.slice(0, -1).join(" — ") : title).trim();
}

/** A short title is set large, a long one smaller, so both fit in two lines. */
export function titleSize(title: string): number {
  if (title.length <= 22) return 92;
  if (title.length <= 34) return 76;
  return 64;
}

function metaContent(head: string, property: string): string | undefined {
  const tag = head.match(
    new RegExp(`<meta\\b[^>]*\\b(?:property|name)=["']${property}["'][^>]*>`, "i"),
  )?.[0];
  const content = tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1];
  return content === undefined ? undefined : decodeEntities(content);
}

/** Title and description the page advertises, and its canonical route. */
export function readPageCard(
  html: string,
  origin = PRODUCTION_ORIGIN,
): { route: string; title: string; description: string } | undefined {
  const head = html.slice(0, html.indexOf("</head>"));
  const canonical = head.match(/<link\b[^>]*\brel=["']?canonical["']?[^>]*>/i)?.[0];
  const href = canonical?.match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (!href?.startsWith(origin)) return undefined;
  const route = href.slice(origin.length) || "/";
  const title = metaContent(head, "og:title") ?? "";
  if (!title) return undefined;
  return { route, title, description: metaContent(head, "og:description") ?? "" };
}

/** Every image tag this step owns — Vocs' static ones and any earlier run's. */
const IMAGE_TAG =
  /[ \t]*<meta\b[^>]*\b(?:property|name)=["']?(?:og:image|twitter:image)(?::[a-z]+)?["']?[^>]*>[ \t]*\n?/gi;

/** Points a page's share image at its own card. */
export function withOgImageTags(html: string, imageUrl: string, alt: string): string {
  const headEnd = html.indexOf("</head>");
  if (headEnd === -1) return html;
  const url = escapeAttribute(imageUrl);
  const altText = escapeAttribute(alt);
  const tags = [
    `<meta property="og:image" content="${url}"/>`,
    '<meta property="og:image:type" content="image/jpeg"/>',
    `<meta property="og:image:width" content="${WIDTH}"/>`,
    `<meta property="og:image:height" content="${HEIGHT}"/>`,
    `<meta property="og:image:alt" content="${altText}"/>`,
    `<meta name="twitter:image" content="${url}"/>`,
    `<meta name="twitter:image:alt" content="${altText}"/>`,
  ].join("");
  return html.slice(0, headEnd).replace(IMAGE_TAG, "") + tags + html.slice(headEnd);
}

// ---------------------------------------------------------------------------
// Rendering.
// ---------------------------------------------------------------------------

type Fonts = Parameters<typeof satori>[1]["fonts"];
type Node = { type: string; props: Record<string, unknown> };

const node = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

async function loadFonts(): Promise<Fonts | undefined> {
  try {
    const res = await fetch(DISPLAY_FONT_URL, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const display = Buffer.from(await wawoff2.decompress(new Uint8Array(await res.arrayBuffer())));
    return [
      { name: "PP Editorial New", data: display, weight: 200, style: "normal" },
      { name: "Inter Tight", data: readFileSync(SANS_FONT), weight: 400, style: "normal" },
    ];
  } catch (error) {
    console.warn(
      `[og-images] could not load ${DISPLAY_FONT_URL} (${(error as Error).message}) — pages keep the static og-image.png`,
    );
    return undefined;
  }
}

/** The card's text and symbol, on a transparent canvas the scene goes under. */
function card(fullTitle: string, description: string, label: string, symbol: string): Node {
  const title = cardTitle(fullTitle);
  return node(
    "div",
    {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "56px 64px",
      color: "#ffffff",
      // The dApp's veil: black, heaviest behind the text on the left, gone by
      // the right-hand pillar. Measured off its cards against the bare scene.
      backgroundImage:
        "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0) 85%)",
    },
    [
      node("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, [
        node("div", { display: "flex", flexDirection: "column", maxWidth: 880 }, [
          node(
            "div",
            {
              fontFamily: "PP Editorial New",
              fontWeight: 200,
              fontSize: titleSize(title),
              lineHeight: 1.02,
              // The dApp's cards and the landing's display type both set it at -9%.
              letterSpacing: "-0.09em",
            },
            truncate(title, 60),
          ),
          node(
            "div",
            { fontFamily: "Inter Tight", fontSize: 24, marginTop: 20, opacity: 0.9 },
            truncate(label, 70),
          ),
        ]),
        { type: "img", props: { src: symbol, width: 80, height: 80, style: { flexShrink: 0 } } },
      ]),
      node(
        "div",
        { fontFamily: "Inter Tight", fontSize: 28, lineHeight: 1.35, maxWidth: 640 },
        truncate(description, 140),
      ),
    ],
  );
}

type Rendered = { path: string; version: string; jpeg: Buffer; title: string };

async function renderAll(
  pages: Map<string, { title: string; description: string }>,
  fonts: Fonts,
): Promise<Map<string, Rendered>> {
  const background = readFileSync(join(ASSETS, "background.jpg"));
  const symbolPng = await sharp(readFileSync(join(ASSETS, "symbol.svg")))
    .resize(160, 160)
    .png()
    .toBuffer();
  const symbol = `data:image/png;base64,${symbolPng.toString("base64")}`;

  const rendered = new Map<string, Rendered>();
  const entries = [...pages];
  // A few at a time: sharp works off the main thread, satori does not.
  for (let i = 0; i < entries.length; i += 8) {
    await Promise.all(
      entries.slice(i, i + 8).map(async ([route, { title, description }]) => {
        const svg = await satori(card(title, description, urlLabel(route), symbol) as never, {
          width: WIDTH,
          height: HEIGHT,
          fonts,
        });
        const jpeg = await sharp(background)
          .composite([{ input: Buffer.from(svg) }])
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
        // Crawlers cache share images by URL; a content hash in the query makes
        // a changed card a new URL, the way Next versions its own.
        const version = createHash("sha256").update(jpeg).digest("hex").slice(0, 16);
        rendered.set(route, { path: ogImagePath(route), version, jpeg, title });
      }),
    );
  }
  return rendered;
}

// ---------------------------------------------------------------------------
// Build step.
// ---------------------------------------------------------------------------

function htmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(full));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

async function main(): Promise<void> {
  const outDirs = OUTPUT_DIRS.filter((dir) => existsSync(dir));
  if (outDirs.length === 0) {
    console.error("[og-images] no build output found — run `pnpm build` first.");
    process.exit(1);
  }

  // Both output dirs hold the same pages: read them once, from the first.
  const pages = new Map<string, { title: string; description: string }>();
  for (const file of htmlFiles(outDirs[0])) {
    const page = readPageCard(readFileSync(file, "utf-8"));
    if (page) pages.set(page.route, { title: page.title, description: page.description });
  }

  const fonts = await loadFonts();
  if (!fonts) return;

  const started = Date.now();
  const rendered = await renderAll(pages, fonts);

  for (const dir of outDirs) {
    let tagged = 0;
    for (const { path, jpeg } of rendered.values()) {
      const target = join(dir, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, jpeg);
    }
    for (const file of htmlFiles(dir)) {
      const html = readFileSync(file, "utf-8");
      const page = readPageCard(html);
      const card = page && rendered.get(page.route);
      if (!card) continue;
      const url = `${PRODUCTION_ORIGIN}/${card.path}?${card.version}`;
      const next = withOgImageTags(html, url, card.title);
      if (next !== html) writeFileSync(file, next, "utf-8");
      tagged++;
    }
    const bytes = [...rendered.values()].reduce((sum, r) => sum + r.jpeg.length, 0);
    console.log(
      `[og-images] ${relative(ROOT, dir)}: ${rendered.size} card(s) in og/ (${Math.round(bytes / 1024)} KB), og:image set on ${tagged} page(s), ${Date.now() - started} ms`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
