import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadSitemapOrder,
  sortChildren,
} from "../scripts/generate-sidebar";

interface Item {
  text: string;
  link?: string;
  items?: Item[];
}

function map(...items: Item[]): Map<string, Item> {
  const m = new Map<string, Item>();
  for (const it of items) {
    const slug = (it.link ?? `/${it.text.toLowerCase()}`).split("/").pop() ?? "";
    m.set(slug, it);
  }
  return m;
}

describe("loadSitemapOrder", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sitemap-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns positions in the sitemap order, normalised to Vocs routes", () => {
    const path = join(dir, "_sitemap.json");
    writeFileSync(
      path,
      JSON.stringify([
        { url: "https://x/", pathname: "/", outputPath: "x" },
        {
          url: "https://x/products/parallel-v3",
          pathname: "/products/parallel-v3",
          outputPath: "x",
        },
        {
          url: "https://x/products/parallel-v3/how-it-works/parallelizer-module",
          pathname: "/products/parallel-v3/how-it-works/parallelizer-module",
          outputPath: "x",
        },
        {
          url: "https://x/products/parallel-v3/how-it-works/savings-module",
          pathname: "/products/parallel-v3/how-it-works/savings-module",
          outputPath: "x",
        },
      ]),
    );
    const order = loadSitemapOrder(path);
    expect(order.get("/")).toBe(0);
    expect(order.get("/products/parallel-v3")).toBe(1);
    expect(
      order.get("/products/parallel-v3/how-it-works/parallelizer-module"),
    ).toBe(2);
    expect(order.get("/products/parallel-v3/how-it-works/savings-module")).toBe(3);
  });

  it("strips trailing slashes (sauf root) when normalising routes", () => {
    const path = join(dir, "_sitemap.json");
    writeFileSync(
      path,
      JSON.stringify([
        { url: "https://x/foo/", pathname: "/foo/", outputPath: "x" },
      ]),
    );
    const order = loadSitemapOrder(path);
    expect(order.get("/foo")).toBe(0);
    expect(order.has("/foo/")).toBe(false);
  });

  it("returns empty map (with warning) when sitemap file is missing", () => {
    const order = loadSitemapOrder(join(dir, "missing.json"));
    expect(order.size).toBe(0);
  });

  it("returns empty map when sitemap JSON is corrupt", () => {
    const path = join(dir, "_sitemap.json");
    writeFileSync(path, "not json");
    const order = loadSitemapOrder(path);
    expect(order.size).toBe(0);
  });
});

describe("sortChildren — sitemap-driven order", () => {
  it("orders children by their position in the sitemap", () => {
    const order = new Map<string, number>([
      ["/products/parallel-v3/how-it-works/parallelizer-module", 0],
      ["/products/parallel-v3/how-it-works/savings-module", 1],
      ["/products/parallel-v3/how-it-works/bridging-module", 2],
      ["/products/parallel-v3/how-it-works/flashloan-module", 3],
    ]);

    const children = map(
      {
        text: "Bridging Module",
        link: "/products/parallel-v3/how-it-works/bridging-module",
      },
      {
        text: "Flashloan Module",
        link: "/products/parallel-v3/how-it-works/flashloan-module",
      },
      {
        text: "Parallelizer Module",
        link: "/products/parallel-v3/how-it-works/parallelizer-module",
      },
      {
        text: "Savings Module",
        link: "/products/parallel-v3/how-it-works/savings-module",
      },
    );

    const sorted = sortChildren(
      children,
      "/products/parallel-v3/how-it-works",
      order,
    );
    expect(sorted.map((c) => c.text)).toEqual([
      "Parallelizer Module",
      "Savings Module",
      "Bridging Module",
      "Flashloan Module",
    ]);
  });

  it("orders sections (without `link`) using their first descendant's link", () => {
    const order = new Map<string, number>([
      ["/products/parallel-v2/how-it-works/vaults", 0],
      ["/products/parallel-v2/how-it-works/bridging-module", 1],
      ["/products/parallel-v2/how-it-works/super-vaults-sv", 2],
    ]);

    const children = map(
      {
        text: "Bridging Module",
        items: [
          { text: "Bridging", link: "/products/parallel-v2/how-it-works/bridging-module" },
        ],
      },
      {
        text: "Super Vaults",
        items: [
          { text: "SV", link: "/products/parallel-v2/how-it-works/super-vaults-sv" },
        ],
      },
      {
        text: "Vaults",
        items: [
          { text: "V", link: "/products/parallel-v2/how-it-works/vaults" },
        ],
      },
    );

    const sorted = sortChildren(
      children,
      "/products/parallel-v2/how-it-works",
      order,
    );
    expect(sorted.map((c) => c.text)).toEqual(["Vaults", "Bridging Module", "Super Vaults"]);
  });

  it("falls back to alphabetical for routes absent from the sitemap (appended at the end)", () => {
    const order = new Map<string, number>([
      ["/foo/known-a", 0],
      ["/foo/known-b", 1],
    ]);
    const children = map(
      { text: "Known A", link: "/foo/known-a" },
      { text: "Zebra Unknown", link: "/foo/zebra-unknown" },
      { text: "Known B", link: "/foo/known-b" },
      { text: "Apple Unknown", link: "/foo/apple-unknown" },
    );
    const sorted = sortChildren(children, "/foo", order);
    expect(sorted.map((c) => c.text)).toEqual([
      "Known A",
      "Known B",
      // Unknowns at the tail, sorted alphabetically
      "Apple Unknown",
      "Zebra Unknown",
    ]);
  });

  it("falls back to alphabetical for ALL children when sitemap is empty", () => {
    const order = new Map<string, number>();
    const children = map(
      { text: "Charlie", link: "/x/c" },
      { text: "Alpha", link: "/x/a" },
      { text: "Bravo", link: "/x/b" },
    );
    const sorted = sortChildren(children, "/x", order);
    expect(sorted.map((c) => c.text)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });
});
