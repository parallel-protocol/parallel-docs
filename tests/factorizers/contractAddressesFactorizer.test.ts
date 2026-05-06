import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  extractContracts,
  factorizeContractAddresses,
} from "../../scripts/crawler/factorizers/contractAddressesFactorizer";

const FIXTURES = resolve(__dirname, "../fixtures/factorizers");

function fixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf-8");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupPages(root: string): { pagesDir: string; dataDir: string } {
  const pagesDir = join(root, "pages");
  const dataDir = join(root, "data");

  const usdpDir = join(
    pagesDir,
    "developers-hub",
    "contract-addresses",
    "parallel-v3",
    "usdp",
  );
  mkdirSync(usdpDir, { recursive: true });
  writeFileSync(join(usdpDir, "ethereum.mdx"), fixture("usdp-ethereum.mdx"), "utf-8");
  writeFileSync(join(usdpDir, "base.mdx"), fixture("usdp-base.mdx"), "utf-8");

  const prlDir = join(
    pagesDir,
    "developers-hub",
    "contract-addresses",
    "parallel-v3",
    "prl",
  );
  mkdirSync(prlDir, { recursive: true });
  writeFileSync(join(prlDir, "ethereum.mdx"), fixture("prl-ethereum.mdx"), "utf-8");

  mkdirSync(dataDir, { recursive: true });
  return { pagesDir, dataDir };
}

// ─── Unit: extractContracts ───────────────────────────────────────────────────

describe("extractContracts", () => {
  it("parses contracts from multiple sections", () => {
    const contracts = extractContracts(fixture("usdp-ethereum.mdx"));
    expect(contracts).toHaveLength(4);

    const names = contracts.map((c) => c.name);
    expect(names).toContain("USDPAccessManager");
    expect(names).toContain("USDP");
    expect(names).toContain("Stabilizer");
    expect(names).toContain("StabilizerFeeManager");
  });

  it("extracts 0x addresses from markdown links", () => {
    const contracts = extractContracts(fixture("usdp-ethereum.mdx"));
    for (const c of contracts) {
      expect(c.address).toMatch(/^0x[0-9a-fA-F]+$/);
    }
  });

  it("stores section heading as description", () => {
    const contracts = extractContracts(fixture("usdp-ethereum.mdx"));
    const coreContracts = contracts.filter((c) => c.description === "Core Protocol");
    const stabContracts = contracts.filter((c) => c.description === "Stabilizer Module");

    expect(coreContracts).toHaveLength(2);
    expect(stabContracts).toHaveLength(2);
  });

  it("strips <PageHeader /> JSX before parsing", () => {
    const contracts = extractContracts(fixture("usdp-ethereum.mdx"));
    // If PageHeader were not stripped, its attribute text could bleed into table parsing.
    // We simply assert the correct number and no garbage names.
    expect(contracts.every((c) => !c.name.includes("PageHeader"))).toBe(true);
  });

  it("handles a page with no PageHeader (base fixture)", () => {
    const contracts = extractContracts(fixture("usdp-base.mdx"));
    expect(contracts).toHaveLength(2);
    expect(contracts[0].name).toBe("USDP");
    expect(contracts[1].name).toBe("sUSDP");
  });

  it("returns empty array for content with no tables", () => {
    const content = "---\ntitle: Empty\n---\n\n## Section\n\nJust prose.\n";
    expect(extractContracts(content)).toHaveLength(0);
  });
});

// ─── Integration: factorizeContractAddresses ─────────────────────────────────

describe("factorizeContractAddresses", () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), "factorizer-test-"));
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  // ── Discovery ──────────────────────────────────────────────────────────────

  it("discovers chain files and returns one result per token", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });

    const stablecoins = results.map((r) => r.stablecoin).sort();
    expect(stablecoins).toContain("USDP");
    expect(stablecoins).toContain("PRL");
  });

  it("lists processed chains per token", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });

    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    expect(usdp.chainsProcessed).toContain("ethereum");
    expect(usdp.chainsProcessed).toContain("base");

    const prl = results.find((r) => r.stablecoin === "PRL")!;
    expect(prl.chainsProcessed).toContain("ethereum");
  });

  it("skips existing index.mdx files", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const usdpDir = join(
      pagesDir,
      "developers-hub",
      "contract-addresses",
      "parallel-v3",
      "usdp",
    );
    // Place a pre-existing index.mdx — should be ignored in discovery
    writeFileSync(join(usdpDir, "index.mdx"), "# existing index", "utf-8");

    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });
    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    expect(usdp.chainsProcessed).not.toContain("index");
  });

  it("populates filesDeleted with chain MDX paths", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });

    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    expect(usdp.filesDeleted.length).toBe(2);
    expect(usdp.filesDeleted.some((p) => p.endsWith("ethereum.mdx"))).toBe(true);
    expect(usdp.filesDeleted.some((p) => p.endsWith("base.mdx"))).toBe(true);
  });

  // ── Data file generation ───────────────────────────────────────────────────

  it("writes data file with correct export name and entries", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir });

    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    const dataContent = readFileSync(usdp.outputDataPath, "utf-8");

    expect(dataContent).toContain("export const USDP_ADDRESSES");
    expect(dataContent).toContain('"ethereum"');
    expect(dataContent).toContain('"base"');
    expect(dataContent).toContain("USDPAccessManager");
    expect(dataContent).toContain("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("writes PRL data file with correct var name", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir });

    const prl = results.find((r) => r.stablecoin === "PRL")!;
    const dataContent = readFileSync(prl.outputDataPath, "utf-8");

    expect(dataContent).toContain("export const PRL_ADDRESSES");
    expect(dataContent).toContain('"PRL"');
    expect(dataContent).toContain("0xDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd");
  });

  it("sorts chains alphabetically in data file", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir });

    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    const dataContent = readFileSync(usdp.outputDataPath, "utf-8");

    const baseIdx = dataContent.indexOf('"base"');
    const ethIdx = dataContent.indexOf('"ethereum"');
    expect(baseIdx).toBeLessThan(ethIdx); // "base" before "ethereum" alphabetically
  });

  // ── Index MDX generation ───────────────────────────────────────────────────

  it("writes index.mdx with ContractAddressesPage usage", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir });

    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    const mdxContent = readFileSync(usdp.outputPagePath, "utf-8");

    expect(mdxContent).toContain("import { ContractAddressesPage }");
    expect(mdxContent).toContain("import { USDP_ADDRESSES }");
    expect(mdxContent).toContain('@/data/usdp-addresses');
    expect(mdxContent).toContain('<ContractAddressesPage stablecoin="USDP"');
    expect(mdxContent).toContain("chains={USDP_ADDRESSES}");
  });

  it("includes correct frontmatter title in index.mdx", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir });

    const usdp = results.find((r) => r.stablecoin === "USDP")!;
    const mdxContent = readFileSync(usdp.outputPagePath, "utf-8");

    expect(mdxContent).toContain("title: USDP Contract Addresses");
  });

  // ── File deletion ──────────────────────────────────────────────────────────

  it("deletes chain MDX files after factorization", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const usdpDir = join(
      pagesDir,
      "developers-hub",
      "contract-addresses",
      "parallel-v3",
      "usdp",
    );

    const ethereumPath = join(usdpDir, "ethereum.mdx");
    const basePath = join(usdpDir, "base.mdx");

    expect(existsSync(ethereumPath)).toBe(true);
    expect(existsSync(basePath)).toBe(true);

    await factorizeContractAddresses({ pagesDir, dataDir });

    expect(existsSync(ethereumPath)).toBe(false);
    expect(existsSync(basePath)).toBe(false);
  });

  it("preserves index.mdx when chain files are deleted", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    await factorizeContractAddresses({ pagesDir, dataDir });

    const usdp = (await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true })).find(
      () => true,
    );
    // index.mdx must exist (was written in first run)
    const usdpIndexPath = join(
      pagesDir,
      "developers-hub",
      "contract-addresses",
      "parallel-v3",
      "usdp",
      "index.mdx",
    );
    expect(existsSync(usdpIndexPath)).toBe(true);
    void usdp;
  });

  // ── dryRun ─────────────────────────────────────────────────────────────────

  it("dryRun=true: does not write data files", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });

    for (const r of results) {
      expect(existsSync(r.outputDataPath)).toBe(false);
    }
  });

  it("dryRun=true: does not write index.mdx files", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });

    for (const r of results) {
      expect(existsSync(r.outputPagePath)).toBe(false);
    }
  });

  it("dryRun=true: does not delete chain MDX files", async () => {
    const { pagesDir, dataDir } = setupPages(tmpRoot);
    const results = await factorizeContractAddresses({ pagesDir, dataDir, dryRun: true });

    for (const r of results) {
      for (const f of r.filesDeleted) {
        expect(existsSync(f)).toBe(true);
      }
    }
  });

  it("returns empty array when no chain pages exist", async () => {
    const emptyPages = join(tmpRoot, "empty-pages");
    mkdirSync(emptyPages, { recursive: true });
    const results = await factorizeContractAddresses({
      pagesDir: emptyPages,
      dataDir: join(tmpRoot, "data"),
    });
    expect(results).toHaveLength(0);
  });
});
