import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

export interface ContractEntry {
  name: string;
  address: string;
  description?: string;
}

export interface FactorizerOptions {
  pagesDir: string;
  dataDir: string;
  dryRun?: boolean;
}

export interface FactorizationResult {
  stablecoin: string;
  chainsProcessed: string[];
  outputPagePath: string;
  outputDataPath: string;
  filesDeleted: string[];
}

// Matches: developers-hub/contract-addresses/parallel-v{2,3}/{token}/{chain}.mdx
const CHAIN_PAGE_RE =
  /developers-hub\/contract-addresses\/(parallel-v[23])\/([^/]+)\/([^/]+)\.mdx$/;

const TOKEN_NAME: Record<string, string> = {
  usdp: "USDP",
  prl: "PRL",
  par: "PAR",
  "par-1": "paUSD",
  mimo: "MIMO",
};

const TOKEN_VAR: Record<string, string> = {
  usdp: "USDP_ADDRESSES",
  prl: "PRL_ADDRESSES",
  par: "PAR_ADDRESSES",
  "par-1": "PAUSD_ADDRESSES",
  mimo: "MIMO_ADDRESSES",
};

const TOKEN_DATA_FILE: Record<string, string> = {
  usdp: "usdp-addresses.ts",
  prl: "prl-addresses.ts",
  par: "par-addresses.ts",
  "par-1": "pausd-addresses.ts",
  mimo: "mimo-addresses.ts",
};

function tokenName(slug: string): string {
  return TOKEN_NAME[slug] ?? slug.toUpperCase();
}

function tokenVar(slug: string): string {
  return TOKEN_VAR[slug] ?? `${slug.toUpperCase().replace(/-/g, "_")}_ADDRESSES`;
}

function tokenDataFile(slug: string): string {
  return TOKEN_DATA_FILE[slug] ?? `${slug}-addresses.ts`;
}

// ── Extraction helpers ───────────────────────────────────────────────────────

function stripFrontmatter(content: string): string {
  const m = content.match(/^---\n[\s\S]*?\n---\n/);
  return m ? content.slice(m[0].length) : content;
}

function stripPageHeader(content: string): string {
  return content.replace(/<PageHeader[^>]*\/?>/g, "");
}

function mdLinkLabel(cell: string): string {
  const m = cell.match(/\[([^\]]+)\]\([^)]+\)/);
  return m ? m[1].trim() : cell.trim();
}

function extractAddress(cell: string): string {
  const label = mdLinkLabel(cell);
  if (label.startsWith("0x")) return label;
  const hex = cell.match(/0x[0-9a-fA-F]+/);
  return hex ? hex[0] : "";
}

export function extractContracts(mdxContent: string): ContractEntry[] {
  const body = stripPageHeader(stripFrontmatter(mdxContent));
  const lines = body.split("\n");
  const contracts: ContractEntry[] = [];

  let section = "";
  let headerParsed = false;
  let nameCol = -1;
  let addrCol = -1;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      section = heading[1].trim();
      headerParsed = false;
      nameCol = -1;
      addrCol = -1;
      continue;
    }

    if (!line.startsWith("|")) {
      if (headerParsed) {
        headerParsed = false;
        nameCol = -1;
        addrCol = -1;
      }
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    if (!headerParsed) {
      const ni = cells.findIndex(
        (c) => /contract\s*name/i.test(c) || c.toLowerCase() === "contract",
      );
      const ai = cells.findIndex(
        (c) => /contract\s*address/i.test(c) || c.toLowerCase() === "address",
      );
      if (ni !== -1 && ai !== -1) {
        nameCol = ni;
        addrCol = ai;
        headerParsed = true;
      }
      continue;
    }

    // Skip separator row (| --- | --- |)
    if (/^\|[\s\-:|]+\|$/.test(line)) continue;

    if (cells.length <= Math.max(nameCol, addrCol)) continue;

    const name = mdLinkLabel(cells[nameCol] ?? "");
    const address = extractAddress(cells[addrCol] ?? "");
    if (name && address) {
      contracts.push({ name, address, description: section || undefined });
    }
  }

  return contracts;
}

// ── Discovery ────────────────────────────────────────────────────────────────

interface ChainFile {
  version: string;
  tokenSlug: string;
  chainSlug: string;
  filePath: string;
}

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function discoverChainFiles(pagesDir: string): Map<string, ChainFile[]> {
  const groups = new Map<string, ChainFile[]>();
  for (const filePath of walkFiles(pagesDir)) {
    const rel = relative(pagesDir, filePath).replace(/\\/g, "/");
    const m = rel.match(CHAIN_PAGE_RE);
    if (!m) continue;
    const [, version, tokenSlug, chainSlug] = m;
    if (chainSlug === "index") continue;
    const key = `${version}/${tokenSlug}`;
    if (!groups.has(key)) groups.set(key, []);
    const group = groups.get(key);
    if (group) group.push({ version, tokenSlug, chainSlug, filePath });
  }
  return groups;
}

// ── Render helpers ───────────────────────────────────────────────────────────

function renderDataFile(varName: string, chainData: Record<string, ContractEntry[]>): string {
  const lines: string[] = [
    "import type { ContractEntry } from '@/components/ContractAddressesPage';",
    "",
    `export const ${varName}: Record<string, ContractEntry[]> = {`,
  ];
  for (const [chain, contracts] of Object.entries(chainData)) {
    lines.push(`  ${JSON.stringify(chain)}: [`);
    for (const c of contracts) {
      const desc = c.description ? `, description: ${JSON.stringify(c.description)}` : "";
      lines.push(
        `    { name: ${JSON.stringify(c.name)}, address: ${JSON.stringify(c.address)}${desc} },`,
      );
    }
    lines.push("  ],");
  }
  lines.push("};");
  return `${lines.join("\n")}\n`;
}

function renderIndexMdx(name: string, varName: string, dataFile: string): string {
  const base = dataFile.replace(/\.ts$/, "");
  return [
    "---",
    `title: ${name} Contract Addresses`,
    `description: Deployed ${name} contracts across supported chains.`,
    "---",
    "",
    "import { ContractAddressesPage } from '@/components/ContractAddressesPage';",
    `import { ${varName} } from '@/data/${base}';`,
    "",
    `# ${name} Contract Addresses`,
    "",
    `<ContractAddressesPage stablecoin="${name}" chains={${varName}} />`,
    "",
  ].join("\n");
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function factorizeContractAddresses(
  options: FactorizerOptions,
): Promise<FactorizationResult[]> {
  const { pagesDir, dataDir, dryRun = false } = options;
  const results: FactorizationResult[] = [];

  for (const [key, chainFiles] of discoverChainFiles(pagesDir)) {
    const { version, tokenSlug } = chainFiles[0];
    const name = tokenName(tokenSlug);
    const varName = tokenVar(tokenSlug);
    const dataFileName = tokenDataFile(tokenSlug);

    // Extract and sort chains alphabetically for stable output
    const raw: Record<string, ContractEntry[]> = {};
    for (const { chainSlug, filePath } of chainFiles) {
      raw[chainSlug] = extractContracts(readFileSync(filePath, "utf-8"));
    }
    const chainData: Record<string, ContractEntry[]> = {};
    for (const k of Object.keys(raw).sort()) chainData[k] = raw[k];

    const tokenDir = join(pagesDir, "developers-hub", "contract-addresses", version, tokenSlug);
    const outputPagePath = join(tokenDir, "index.mdx");
    const outputDataPath = join(dataDir, dataFileName);

    if (!dryRun) {
      if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
      writeFileSync(outputDataPath, renderDataFile(varName, chainData), "utf-8");

      if (!existsSync(tokenDir)) mkdirSync(tokenDir, { recursive: true });
      writeFileSync(outputPagePath, renderIndexMdx(name, varName, dataFileName), "utf-8");
    }

    const filesDeleted: string[] = chainFiles.map((f) => f.filePath);
    if (!dryRun) {
      for (const f of filesDeleted) rmSync(f);
    }

    results.push({
      stablecoin: name,
      chainsProcessed: Object.keys(chainData),
      outputPagePath,
      outputDataPath,
      filesDeleted,
    });
  }

  return results;
}
