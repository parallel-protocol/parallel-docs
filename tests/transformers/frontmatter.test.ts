import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { frontmatter } from "../../scripts/crawler/transformers/frontmatter";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const fixturesDir = resolve(__dirname, "../fixtures");

const cache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => {},
};

const ctx: TransformContext = {
  url: "https://docs.eusd.xyz/test",
  outputPath: "docs/pages/test.mdx",
  imagesDir: "docs/public/images",
  cache,
};

describe("frontmatter", () => {
  it("extracts title from H1 and description from first paragraph", () => {
    const input = readFileSync(resolve(fixturesDir, "simple-page.md"), "utf-8");
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("Stabilizer Module");
    expect(parsed.data.description).toBe(
      "The Stabilizer Module is the core mechanism of eUSD. It handles minting and redemption operations across multiple chains.",
    );
    expect(parsed.content).not.toMatch(/^# Stabilizer Module/m);
    expect(parsed.content).toMatch(/^## How it works/m);
  });

  it("truncates description >160 chars with an ellipsis", () => {
    const input = readFileSync(resolve(fixturesDir, "long-paragraph.md"), "utf-8");
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.description.length).toBeLessThanOrEqual(160);
    expect(parsed.data.description.endsWith("…")).toBe(true);
  });

  it("falls back to empty description when no paragraph follows the H1", () => {
    const input = readFileSync(resolve(fixturesDir, "no-paragraph.md"), "utf-8");
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("Empty Intro");
    expect(parsed.data.description).toBe("");
  });

  it("throws if no H1 is present", () => {
    const input = "Just some text without a title.\n\nSecond paragraph.";
    expect(() => frontmatter.apply(input, ctx)).toThrow(/H1/);
  });

  it("replaces an existing frontmatter (not concatenates)", () => {
    const input = "---\ntitle: Old\nfoo: bar\n---\n\n# New Title\n\nIntro paragraph.";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("New Title");
    expect(parsed.data.foo).toBeUndefined();
  });

  it("skips markdown tables and uses the next paragraph", () => {
    const input = readFileSync(resolve(fixturesDir, "with-table-first.md"), "utf-8");
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("Audits Page");
    expect(parsed.data.description).toBe(
      "This page lists the third-party audits performed on the protocol.",
    );
    expect(parsed.data.description).not.toContain("|");
  });

  it("skips HTML blocks (<figure>, <table>, etc.) and uses the next paragraph", () => {
    const input = readFileSync(resolve(fixturesDir, "with-html-block-first.md"), "utf-8");
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("HTML Block Page");
    expect(parsed.data.description).toBe(
      "This page introduces the architecture with a diagram above.",
    );
    expect(parsed.data.description).not.toContain("<");
  });

  it("falls back to empty description when only a table follows the H1 AND no subtitle", () => {
    const input = readFileSync(resolve(fixturesDir, "only-table.md"), "utf-8");
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("Only Table Page");
    expect(parsed.data.description).toBe("");
  });

  it("falls back to subtitle when the body opens with a table and a subtitle is set", () => {
    const tableBody = readFileSync(resolve(fixturesDir, "only-table.md"), "utf-8");
    const input = `---\nsubtitle: A breakdown of security audits\n---\n\n${tableBody}`;
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("Only Table Page");
    expect(parsed.data.description).toBe("A breakdown of security audits");
    // subtitle is still preserved as a separate frontmatter field
    expect(parsed.data.subtitle).toBe("A breakdown of security audits");
  });

  it("falls back to subtitle when no paragraph follows the H1 and a subtitle is set", () => {
    const noPara = readFileSync(resolve(fixturesDir, "no-paragraph.md"), "utf-8");
    const input = `---\nsubtitle: Introducing the protocol\n---\n\n${noPara}`;
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.description).toBe("Introducing the protocol");
  });

  it("does NOT fall back to subtitle when the body has a real intro paragraph", () => {
    const input =
      "---\nsubtitle: Should not appear in description\n---\n\n# Title\n\nReal intro paragraph.";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.description).toBe("Real intro paragraph.");
    expect(parsed.data.subtitle).toBe("Should not appear in description");
  });

  it("unescapes HTML entities in the description (&amp;, &quot;, &lt;, &gt;, &apos;, &#39;)", () => {
    const input =
      "# Title\n\nHyperlane &amp; Eden, the &quot;modular&quot; L2: 5 &lt; 10 &gt; 0, isn&apos;t it&#39;s simple?";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.description).toBe(
      "Hyperlane & Eden, the \"modular\" L2: 5 < 10 > 0, isn't it's simple?",
    );
  });

  it("unescapes HTML entities in the subtitle fallback path too", () => {
    const input =
      "---\nsubtitle: Hyperlane &amp; Eden integration\n---\n\n# Title\n\n## Section\n\nNot a paragraph (heading first).";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.description).toBe("Hyperlane & Eden integration");
  });

  it("passes through `subtitle` from source frontmatter to output frontmatter", () => {
    const input = "---\nsubtitle: My nice subtitle\n---\n\n# Title\n\nIntro paragraph.";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.title).toBe("Title");
    expect(parsed.data.description).toBe("Intro paragraph.");
    expect(parsed.data.subtitle).toBe("My nice subtitle");
  });

  it("does not add a subtitle key when source frontmatter has none", () => {
    const input = "# Title\n\nIntro paragraph.";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.subtitle).toBeUndefined();
  });

  it("ignores empty/whitespace-only subtitle in source frontmatter", () => {
    const input = "---\nsubtitle: \"   \"\n---\n\n# Title\n\nIntro paragraph.";
    const output = frontmatter.apply(input, ctx) as string;
    const parsed = matter(output);

    expect(parsed.data.subtitle).toBeUndefined();
  });

  it("exposes its name", () => {
    expect(frontmatter.name).toBe("frontmatter");
  });
});
