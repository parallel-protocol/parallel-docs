import { describe, expect, it } from "vitest";

import { type AddressBook, expandComponents, renderAddressBook } from "../scripts/md-components";

const BOOKS: Record<string, AddressBook> = {
  USDP_ADDRESSES: {
    base: [{ name: "USDp", address: "0xaaa", description: "Core Protocol" }],
    "x-layer": [{ name: "USDp", address: "0xbbb", description: "Core Protocol" }],
  },
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
});
