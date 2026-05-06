import { describe, expect, it } from "vitest";
import { legacyBanner } from "../../scripts/crawler/transformers/legacyBanner";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

function ctx(outputPath: string): TransformContext {
  return {
    url: `https://docs.parallel.best${outputPath.replace("docs/pages", "").replace(/\.mdx$/, "").replace(/\/index$/, "")}`,
    outputPath,
    imagesDir: "docs/public/images",
    cache: noopCache,
  };
}

const BANNER_MARKER = "legacy **v2**";
const BANNER_BLOCK = [
  ":::warning",
  "You're reading the legacy **v2** documentation. For current Parallel features, see [v3](/products/parallel-v3).",
  ":::",
].join("\n");

// Typical MDX output of pageHeader transformer on a v2 page
function makeV2Source(body = "Some v2 content.\n"): string {
  return [
    "---",
    "title: Classic Vaults",
    "description: Legacy vault docs",
    "---",
    "import { PageHeader } from '@/components/PageHeader'",
    "",
    `<PageHeader breadcrumb={[{"label":"Products","href":"/products"},{"label":"Parallel V2","href":"/products/parallel-v2"}]} title={"Classic Vaults"} />`,
    "",
    body,
  ].join("\n");
}

describe("legacyBanner", () => {
  it("exposes its name", () => {
    expect(legacyBanner.name).toBe("legacyBanner");
  });

  it("injects banner after PageHeader on a v2 product page", () => {
    const source = makeV2Source("Legacy content.\n");
    const out = legacyBanner.apply(
      source,
      ctx("docs/pages/products/parallel-v2/how-it-works/vaults.mdx"),
    ) as string;

    expect(out).toContain(BANNER_MARKER);

    // Banner must appear AFTER the PageHeader JSX tag
    const phIdx = out.indexOf("<PageHeader ");
    const bannerIdx = out.indexOf(BANNER_BLOCK);
    expect(phIdx).toBeGreaterThanOrEqual(0);
    expect(bannerIdx).toBeGreaterThan(phIdx);

    // Body content must appear AFTER the banner
    const bodyIdx = out.indexOf("Legacy content.");
    expect(bodyIdx).toBeGreaterThan(bannerIdx);
  });

  it("injects banner on a v2 developers-hub page", () => {
    const source = makeV2Source("Dev v2 content.\n");
    const out = legacyBanner.apply(
      source,
      ctx("docs/pages/developers-hub/parallel-v2/classic-vaults/index.mdx"),
    ) as string;

    expect(out).toContain(BANNER_MARKER);
    const phIdx = out.indexOf("<PageHeader ");
    const bannerIdx = out.indexOf(BANNER_BLOCK);
    expect(bannerIdx).toBeGreaterThan(phIdx);
  });

  it("leaves v3 pages unchanged", () => {
    const source = makeV2Source("v3 content.\n").replace(
      "parallel-v2",
      "parallel-v3",
    );
    const out = legacyBanner.apply(
      source,
      ctx("docs/pages/products/parallel-v3/how-it-works/index.mdx"),
    ) as string;

    expect(out).toBe(source);
    expect(out).not.toContain(BANNER_MARKER);
  });

  it("inserts banner after frontmatter when no PageHeader is present", () => {
    const source = [
      "---",
      "title: No Header",
      "description: Edge case",
      "---",
      "",
      "Body without a PageHeader component.",
      "",
    ].join("\n");

    const out = legacyBanner.apply(
      source,
      ctx("docs/pages/products/parallel-v2/licensing.mdx"),
    ) as string;

    expect(out).toContain(BANNER_MARKER);

    // Banner must come before the body
    const bannerIdx = out.indexOf(BANNER_BLOCK);
    const bodyIdx = out.indexOf("Body without a PageHeader");
    expect(bannerIdx).toBeGreaterThanOrEqual(0);
    expect(bodyIdx).toBeGreaterThan(bannerIdx);

    // Frontmatter must still be intact
    expect(out).toContain("title: No Header");
  });

  it("does not inject banner twice (idempotent)", () => {
    const source = makeV2Source();
    const first = legacyBanner.apply(
      source,
      ctx("docs/pages/products/parallel-v2/how-it-works/vaults.mdx"),
    ) as string;
    const second = legacyBanner.apply(
      first,
      ctx("docs/pages/products/parallel-v2/how-it-works/vaults.mdx"),
    ) as string;

    expect(second).toBe(first);
    // Exactly one occurrence of the banner
    const count = (second.match(/legacy \*\*v2\*\*/g) ?? []).length;
    expect(count).toBe(1);
  });
});
