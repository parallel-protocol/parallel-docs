import { describe, expect, it } from "vitest";

import {
  type AddressBook,
  condenseSitemap,
  expandComponents,
  renderAddressBook,
  stripComponentImports,
} from "../scripts/md-components";

const BOOKS: Record<string, AddressBook> = {
  USDP_ADDRESSES: {
    base: [{ name: "USDp", address: "0xaaa", description: "Core Protocol" }],
    "x-layer": [{ name: "USDp", address: "0xbbb", description: "Core Protocol" }],
  },
};

// Shaped like the real PRL book: the token on some chains, and chains that
// carry only tokenomics or deprecated migration contracts.
const PRL_BOOK: AddressBook = {
  ethereum: [{ name: "PRL", address: "0xaaa", description: "Parallel Governance Token" }],
  base: [{ name: "PeripheralPRL", address: "0xbbb", description: "PRL Bridging Module" }],
  avalanche: [{ name: "SideChainFeeDistributor (USDp)", address: "0xccc", description: "PRL Tokenomics" }],
  fantom: [{ name: "PeripheralMigrationContract (deprecated)", address: "0xddd" }],
};

const expand = (md: string) => expandComponents(md, BOOKS);

describe("expandComponents", () => {
  it("renders a contract address page as tables instead of a bare tag", () => {
    const out = expand(
      '# USDp\n\n<ContractAddressesPage stablecoin="USDp" chains={USDP_ADDRESSES} />\n',
    );
    expect(out).not.toContain("<ContractAddressesPage");
    expect(out).toContain("USDp is deployed on 2 chains: Base, X Layer.");
    expect(out).toContain("### Base");
    expect(out).toContain("`0xaaa`");
    // The whole point: the export has to carry real words, not a component name.
    expect(out.split(/\s+/).length).toBeGreaterThan(20);
  });

  it("leaves an unknown address book alone rather than dropping the page", () => {
    const tag = '<ContractAddressesPage stablecoin="PRL" chains={UNKNOWN_ADDRESSES} />';
    expect(expand(tag)).toBe(tag);
  });

  it("turns PdfLink and LinkCard into markdown links", () => {
    expect(expand('<PdfLink href="/a.pdf" label="Report A" />')).toBe("[Report A](/a.pdf)");
    expect(expand('<LinkCard href="https://x.test" title="X" favicon="f" hostname="x" />')).toBe(
      "- [X](https://x.test)",
    );
  });

  it("flattens PageCardGrid in both the JSON and the JS-object spellings", () => {
    expect(expand('<PageCardGrid items={[{"title":"PAR","href":"/par"}]} />')).toBe(
      "- [PAR](/par)",
    );
    expect(
      expand('<PageCardGrid\n  items={[\n  { title: "x402", href: "/agents/x402" },\n  ]}\n/>'),
    ).toBe("- [x402](/agents/x402)");
  });

  it("drops the help footer", () => {
    expect(expand("text\n\n<HelpFooter />\n")).toBe("text\n\n");
  });

  it("unwraps tabs and dedents them, so a table stays a table", () => {
    const out = expand(
      [
        "<Tabs>",
        '  <Tab label="USDp">',
        "    | A | B |",
        "    | --- | --- |",
        "  </Tab>",
        "</Tabs>",
        "",
      ].join("\n"),
    );
    expect(out).toContain("#### USDp");
    // Four leading spaces would have turned the table into a code block.
    expect(out).toContain("| A | B |");
    expect(out).not.toMatch(/^ {4}\| A \| B \|/m);
    expect(out).not.toContain("<Tab");
  });

  it("turns an FAQ into question and answer prose", () => {
    const out = expand(
      '<FAQ items={[\n  { question: "Is it free?", answer: "Yes. No cut, no signup." },\n]} />',
    );
    expect(out).not.toContain("<FAQ");
    expect(out).toBe("**Is it free?**\n\nYes. No cut, no signup.");
  });

  it("keeps an answer that contains an escaped quote", () => {
    const out = expand('<FAQ items={[{ question: "Q?", answer: "He said \\"no\\" twice." }]} />');
    expect(out).toContain('He said "no" twice.');
  });

  it("recovers the TeX behind a rendered KaTeX block", () => {
    const tag =
      '<Math html={"<span class=\\"katex\\"><annotation encoding=\\"application/x-tex\\">a = \\\\frac{b}{c}</annotation></span>"} />';
    expect(expand(tag)).toBe("$$\na = \\frac{b}{c}\n$$");
  });

  it("leaves a Math tag alone when it carries no TeX", () => {
    const tag = '<Math html={"<span>no annotation here</span>"} />';
    expect(expand(tag)).toBe(tag);
  });

  it("is idempotent — a second pass changes nothing", () => {
    const once = expand(
      '# T\n\n<ContractAddressesPage stablecoin="USDp" chains={USDP_ADDRESSES} />\n\n<HelpFooter />\n',
    );
    expect(expand(once)).toBe(once);
  });
});

describe("renderAddressBook", () => {
  it("sorts chains and keeps the module column", () => {
    const out = renderAddressBook("USDp", BOOKS.USDP_ADDRESSES);
    expect(out.indexOf("### Base")).toBeLessThan(out.indexOf("### X Layer"));
    expect(out).toContain("| Contract | Address | Module |");
  });

  it("counts only the chains that carry the token", () => {
    // PRL's address book lists chains that hold tokenomics or deprecated
    // migration contracts and no PRL at all; counting them said the token was
    // on nine chains when it is on six.
    const out = renderAddressBook("PRL", PRL_BOOK);
    expect(out).toContain("PRL is deployed on 2 chains: Base, Ethereum.");
    expect(out).toContain(
      "This page also lists PRL-related contracts on Avalanche, Fantom, which do not carry the token.",
    );
    // The chains that hold no token still get their section.
    expect(out).toContain("### Avalanche");
  });

  it("falls back to every chain when no entry looks like the token", () => {
    const out = renderAddressBook("XYZ", { base: [{ name: "Vault", address: "0xaaa" }] });
    expect(out).toContain("XYZ is deployed on 1 chain: Base.");
    expect(out).not.toContain("do not carry the token");
  });
});

describe("stripComponentImports", () => {
  it("drops an MDX component import left under the H1", () => {
    const md =
      "# Proof of Solvency\n\nimport { LinkCard } from '@/components/LinkCard'\n\n## Introduction\n";
    const out = stripComponentImports(md);
    expect(out).not.toContain("@/components/LinkCard");
    expect(out).toContain("# Proof of Solvency");
    expect(out).toContain("## Introduction");
  });

  it("keeps import statements that are the page's actual content", () => {
    // The x402 quickstart exists to show these lines; a rule matching every
    // `import ... from` would delete the sample it is documenting.
    const md = [
      "# Quickstart",
      "",
      "```ts",
      'import express from "express";',
      'import { paymentMiddleware } from "@parallel-protocol/x402/express";',
      "```",
      "",
    ].join("\n");
    expect(stripComponentImports(md)).toBe(md);
  });

  it("leaves a package import outside a fence alone", () => {
    // Only the `@/` alias is ours; anything else is prose or a bare sample.
    const md = 'import { paymentMiddleware } from "x402-express";\n';
    expect(stripComponentImports(md)).toBe(md);
  });

  it("does not strip inside a fence that opens with tildes", () => {
    const md = ["~~~mdx", "import { LinkCard } from '@/components/LinkCard'", "~~~", ""].join("\n");
    expect(stripComponentImports(md)).toBe(md);
  });
});

describe("condenseSitemap", () => {
  const sitemap = [
    "<!--",
    "Sitemap:",
    "- [Overview](/index): Public documentation of Parallel.",
    "- [Audits](/security/audits): Security reviews.",
    "-->",
    "",
  ].join("\n");

  it("replaces the nav dump with a pointer to the two index files", () => {
    const out = condenseSitemap(`${sitemap}\n# Audits\n\nBody.\n`, "https://docs.parallel.best");
    expect(out).not.toContain("Sitemap:");
    expect(out).not.toContain("/security/audits): Security reviews.");
    expect(out).toContain("https://docs.parallel.best/llms.txt");
    expect(out).toContain("https://docs.parallel.best/llms-full.txt");
    expect(out).toContain("# Audits");
    expect(out).toContain("Body.");
  });

  it("shrinks the preamble by orders of magnitude", () => {
    const before = `${sitemap}\n# Audits\n`;
    const after = condenseSitemap(before, "https://docs.parallel.best");
    expect(after.length).toBeLessThan(before.length + 200);
  });

  it("leaves a document without the block untouched", () => {
    const md = "# Overview\n\nNo sitemap here.\n";
    expect(condenseSitemap(md, "https://docs.parallel.best")).toBe(md);
  });

  it("only touches a block at the very top", () => {
    // A sitemap-shaped comment further down is page content, not the preamble.
    const md = `# Title\n\n${sitemap}`;
    expect(condenseSitemap(md, "https://docs.parallel.best")).toBe(md);
  });
});
