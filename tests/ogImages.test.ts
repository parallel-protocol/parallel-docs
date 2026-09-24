import { describe, expect, it } from "vitest";

import {
  cardTitle,
  decodeEntities,
  ogImagePath,
  readPageCard,
  titleSize,
  truncate,
  urlLabel,
  withOgImageTags,
} from "../scripts/og-images";

const ORIGIN = "https://docs.parallel.best";

/** A page head as Vocs writes it, after postbuild-seo added the canonical. */
const page = (route: string, title: string, description: string) =>
  [
    "<!DOCTYPE html><html><head>",
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta property="og:image" content="${ORIGIN}/og-image.png"/>`,
    '<meta name="twitter:card" content="summary_large_image"/>',
    `<meta property="twitter:image" content="${ORIGIN}/og-image.png"/>`,
    `<link rel="canonical" href="${route === "/" ? ORIGIN : ORIGIN + route}"/>`,
    "</head><body></body></html>",
  ].join("");

describe("ogImagePath", () => {
  it("maps the home page and nested routes under og/", () => {
    expect(ogImagePath("/")).toBe("og/index.jpg");
    expect(ogImagePath("/agents/x402")).toBe("og/agents/x402.jpg");
  });
});

describe("urlLabel", () => {
  it("shows the host without a scheme, and the route after it", () => {
    expect(urlLabel("/", ORIGIN)).toBe("docs.parallel.best");
    expect(urlLabel("/agents/x402", ORIGIN)).toBe("docs.parallel.best/agents/x402");
  });
});

describe("cardTitle", () => {
  it("drops the section a title carries after an em dash", () => {
    expect(cardTitle("PRL Bridging Module Specifications — Governance")).toBe(
      "PRL Bridging Module Specifications",
    );
    expect(cardTitle("What is x402?")).toBe("What is x402?");
  });
});

describe("titleSize", () => {
  it("sets long titles smaller", () => {
    expect(titleSize("Overview")).toBeGreaterThan(titleSize("PRL Bridging Module Specifications"));
  });
});

describe("truncate", () => {
  it("keeps short text as is and cuts long text on a word, with an ellipsis", () => {
    expect(truncate("Short text.", 20)).toBe("Short text.");
    const cut = truncate("one two three four five six seven", 20);
    expect(cut.length).toBeLessThanOrEqual(20);
    expect(cut).toBe("one two three four…");
  });
});

describe("decodeEntities", () => {
  it("reads attribute text as a person would", () => {
    expect(decodeEntities("Parallel&#x27;s &amp; &quot;USDp&quot; &#39;x&#39;")).toBe(
      "Parallel's & \"USDp\" 'x'",
    );
  });
});

describe("readPageCard", () => {
  it("reads the route from the canonical, and the page's own title and description", () => {
    expect(readPageCard(page("/agents/x402", "What is x402?", "Pay per request."), ORIGIN)).toEqual(
      {
        route: "/agents/x402",
        title: "What is x402?",
        description: "Pay per request.",
      },
    );
    expect(readPageCard(page("/", "Overview", "Docs."), ORIGIN)?.route).toBe("/");
  });

  it("skips a file without a canonical (404 and shell pages)", () => {
    const html = page("/x", "Not found", "").replace(/<link rel="canonical"[^>]*>/, "");
    expect(readPageCard(html, ORIGIN)).toBeUndefined();
  });
});

describe("withOgImageTags", () => {
  const url = `${ORIGIN}/og/agents/x402.jpg?abc`;

  it("replaces the static image with the page's card, for Open Graph and X", () => {
    const html = withOgImageTags(page("/agents/x402", "What is x402?", ""), url, "What is x402?");
    expect(html).not.toContain("og-image.png");
    expect(html).toContain(`<meta property="og:image" content="${url}"/>`);
    expect(html).toContain('<meta property="og:image:width" content="1200"/>');
    expect(html).toContain(`<meta name="twitter:image" content="${url}"/>`);
    // The card type Vocs wrote is not an image tag and stays.
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>');
    expect(html.match(/og:image"/g)).toHaveLength(1);
  });

  it("is a no-op when run twice", () => {
    const once = withOgImageTags(page("/a", "A & B", ""), url, "A & B");
    expect(withOgImageTags(once, url, "A & B")).toBe(once);
    expect(once).toContain('content="A &amp; B"');
  });
});
