import { describe, expect, it } from "vitest";
import { tabs } from "../../scripts/crawler/transformers/tabs";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

const ctx: TransformContext = {
  url: "https://docs.eusd.xyz/test",
  outputPath: "docs/pages/test.mdx",
  imagesDir: "docs/public/images",
  cache: noopCache,
};

const IMPORT = `import { Tabs, Tab } from '@/components/Tabs';`;

describe("tabs", () => {
  it("converts a single-tab block to Tabs/Tab JSX and prepends the import", () => {
    const input = '{% tabs %}\n{% tab title="Eden" %}\nContent A.\n{% endtab %}\n{% endtabs %}';
    const out = tabs.apply(input, ctx) as string;
    const expected = `${IMPORT}\n\n<Tabs>\n  <Tab label="Eden">\nContent A.\n  </Tab>\n</Tabs>`;
    expect(out).toBe(expected);
  });

  it("converts multi-tab blocks preserving order and injects import once", () => {
    const input = [
      "{% tabs %}",
      '{% tab title="Eden" %}',
      "Eden content.",
      "{% endtab %}",
      '{% tab title="Ethereum" %}',
      "Ethereum content.",
      "{% endtab %}",
      "{% endtabs %}",
    ].join("\n");
    const out = tabs.apply(input, ctx) as string;
    const block = [
      "<Tabs>",
      '  <Tab label="Eden">',
      "Eden content.",
      "  </Tab>",
      '  <Tab label="Ethereum">',
      "Ethereum content.",
      "  </Tab>",
      "</Tabs>",
    ].join("\n");
    expect(out).toBe(`${IMPORT}\n\n${block}`);
    // Order preserved
    expect(out.indexOf('"Eden"')).toBeLessThan(out.indexOf('"Ethereum"'));
    // Import appears exactly once
    expect((out.match(/import \{ Tabs, Tab \}/g) ?? []).length).toBe(1);
  });

  it("handles GitBook quirk: {% endtab %} merged into table rows", () => {
    const input = [
      "{% tabs %}",
      '{% tab title="Eden" %}',
      "",
      "| Price Feed | Address |",
      "| --- | --- |",
      "| eUSD/USD | [0xb81...](url) |",
      "| {% endtab %} | |",
      "| {% endtabs %} | |",
    ].join("\n");
    const out = tabs.apply(input, ctx) as string;
    expect(out).toContain(IMPORT);
    expect(out).toContain('<Tab label="Eden">');
    expect(out).toContain("| eUSD/USD | [0xb81...](url) |");
    // No GitBook markers remaining
    expect(out).not.toContain("{% endtab %}");
    expect(out).not.toContain("{% endtabs %}");
    expect(out).not.toContain("{% tabs %}");
    expect(out).not.toContain("{% tab title");
    // Valid closing tags present
    expect(out).toContain("  </Tab>");
    expect(out).toContain("</Tabs>");
  });

  it("preserves tables and other markdown inside tab content verbatim", () => {
    const input = [
      "{% tabs %}",
      '{% tab title="A" %}',
      "**Bold** with [link](/x).",
      "",
      "| col1 | col2 |",
      "| ---- | ---- |",
      "| a    | b    |",
      "{% endtab %}",
      "{% endtabs %}",
    ].join("\n");
    const out = tabs.apply(input, ctx) as string;
    expect(out).toContain("**Bold** with [link](/x).");
    expect(out).toContain("| col1 | col2 |");
    expect(out).toContain("| a    | b    |");
  });

  it("preserves text outside tabs blocks", () => {
    const input = [
      "Before.",
      "",
      "{% tabs %}",
      '{% tab title="X" %}',
      "X.",
      "{% endtab %}",
      "{% endtabs %}",
      "",
      "After.",
    ].join("\n");
    const out = tabs.apply(input, ctx) as string;
    expect(out).toContain(IMPORT);
    expect(out).toContain("Before.");
    expect(out).toContain('<Tab label="X">');
    expect(out).toContain("X.");
    expect(out).toContain("After.");
  });

  it("returns source unchanged for content without tabs — no import prepended", () => {
    const input = "# Plain page\n\nSome content.";
    expect(tabs.apply(input, ctx)).toBe(input);
    expect(tabs.apply(input, ctx) as string).not.toContain("import");
  });

  it("does not duplicate import if already present in source", () => {
    const source = `${IMPORT}\n\n{% tabs %}\n{% tab title="X" %}\nX.\n{% endtab %}\n{% endtabs %}`;
    const out = tabs.apply(source, ctx) as string;
    const occurrences = (out.match(/import \{ Tabs, Tab \} from '@\/components\/Tabs';/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("exposes its name", () => {
    expect(tabs.name).toBe("tabs");
  });
});
