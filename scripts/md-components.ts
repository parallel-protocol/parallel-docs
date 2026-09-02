/**
 * Expands the React components left in Vocs' markdown exports.
 *
 * Vocs derives `assets/md/**.md` from the MDX *source*, so a component reaches
 * answer engines as its own JSX tag rather than as its content. On the contract
 * address pages that meant eight useful words for the whole page:
 *
 *     # USDp Contract Addresses
 *     <ContractAddressesPage stablecoin="USDp" chains={USDP_ADDRESSES} />
 *
 * Everything here is a pure string transform so it can be unit tested without a
 * build. A component we do not know is left untouched rather than dropped — a
 * stray tag is recoverable, silently deleted content is not.
 */

export type ContractEntry = { name: string; address: string; description?: string };
export type AddressBook = Record<string, ContractEntry[]>;

/** Title-cases a chain key: `x-layer` → `X Layer`, `bsc` → `Bsc`. */
function chainLabel(key: string): string {
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function markdownTable(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

/** Renders one address book as a section per chain, module headings preserved. */
export function renderAddressBook(stablecoin: string, book: AddressBook): string {
  const chains = Object.keys(book).sort();
  const out: string[] = [
    `${stablecoin} is deployed on ${chains.length} chain${chains.length > 1 ? "s" : ""}: ` +
      `${chains.map(chainLabel).join(", ")}.`,
    "",
  ];
  for (const chain of chains) {
    out.push(`### ${chainLabel(chain)}`, "");
    out.push(
      markdownTable(
        ["Contract", "Address", "Module"],
        book[chain].map((entry) => [entry.name, `\`${entry.address}\``, entry.description ?? ""]),
      ),
      "",
    );
  }
  return out.join("\n");
}

/** Pulls `title`/`href` pairs out of both the JSON and the JS-object spellings. */
function linkPairs(payload: string): { title: string; href: string }[] {
  const pairs: { title: string; href: string }[] = [];
  const re = /["']?title["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?href["']?\s*:\s*["']([^"']+)["']/g;
  let match = re.exec(payload);
  while (match !== null) {
    pairs.push({ title: match[1], href: match[2] });
    match = re.exec(payload);
  }
  return pairs;
}


/** Undoes the JS string escaping of an MDX attribute value. */
function unescapeAttr(value: string): string {
  return value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

/**
 * `<Math html={…} />` carries KaTeX's rendered HTML, and that HTML embeds the
 * original TeX in a MathML annotation. Serving the markup to an answer engine
 * is worse than useless, so the TeX is recovered and written as a display
 * equation.
 */
function mathToTex(tag: string): string | null {
  const match = tag.match(/annotation encoding=\\?"application\/x-tex\\?">([^<]*)</);
  if (!match) return null;
  const tex = unescapeAttr(match[1]).trim();
  return tex ? `$$\n${tex}\n$$` : null;
}

/** Pulls `question`/`answer` pairs, tolerating escaped quotes inside answers. */
function faqPairs(payload: string): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  const re =
    /["']?question["']?\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*["']?answer["']?\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match = re.exec(payload);
  while (match !== null) {
    pairs.push({ question: unescapeAttr(match[1]), answer: unescapeAttr(match[2]) });
    match = re.exec(payload);
  }
  return pairs;
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`));
  return match ? match[1] : null;
}

/**
 * Removes the common leading indentation of a block, ignoring blank lines.
 * Tab bodies are indented inside their wrapper; left as-is after unwrapping,
 * four spaces would silently reinterpret a markdown table as a code block.
 */
function dedent(block: string): string {
  const lines = block.split("\n");
  const indents = lines
    // Blank lines carry no indentation of their own, so counting them would
    // pin the common indent to zero and defeat the dedent.
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const common = indents.length > 0 ? Math.min(...indents) : 0;
  return common === 0 ? block : lines.map((line) => line.slice(common)).join("\n");
}

export function expandComponents(markdown: string, books: Record<string, AddressBook>): string {
  let out = markdown;

  // A pure decoration — it carries no content an answer engine can use.
  out = out.replace(/^[ \t]*<HelpFooter\s*\/>[ \t]*\n?/gm, "");

  out = out.replace(/<ContractAddressesPage\b[^>]*\/>/g, (tag) => {
    const stablecoin = attr(tag, "stablecoin");
    const book = tag.match(/chains=\{([A-Z0-9_]+)\}/)?.[1];
    if (!stablecoin || !book || !books[book]) return tag;
    return renderAddressBook(stablecoin, books[book]);
  });

  out = out.replace(/<PdfLink\b[^>]*\/>/g, (tag) => {
    const href = attr(tag, "href");
    const label = attr(tag, "label");
    return href && label ? `[${label}](${href})` : tag;
  });

  out = out.replace(/<LinkCard\b[^>]*\/>/g, (tag) => {
    const href = attr(tag, "href");
    const title = attr(tag, "title");
    return href && title ? `- [${title}](${href})` : tag;
  });

  out = out.replace(/<PageCardGrid\b[\s\S]*?\/>/g, (tag) => {
    const pairs = linkPairs(tag);
    return pairs.length > 0 ? pairs.map((p) => `- [${p.title}](${p.href})`).join("\n") : tag;
  });


  out = out.replace(/<FAQ\b[\s\S]*?\/>/g, (tag) => {
    const pairs = faqPairs(tag);
    return pairs.length > 0
      ? pairs.map(({ question, answer }) => `**${question}**\n\n${answer}`).join("\n\n")
      : tag;
  });

  out = out.replace(/<Math\b[\s\S]*?\/>/g, (tag) => mathToTex(tag) ?? tag);

  // Tabs hold real markdown, indented inside the wrapper. Dropping the tags
  // alone would leave that indentation behind — and four leading spaces turn a
  // table into a code block — so the block is dedented as it is unwrapped. The
  // label becomes a heading so each tab's subject survives the flattening.
  out = out.replace(
    /^[ \t]*<Tabs>[ \t]*\n([\s\S]*?)^[ \t]*<\/Tabs>[ \t]*\n?/gm,
    (all, body: string) => {
      const tab =
        /^[ \t]*<Tab\b[^>]*\blabel=["']([^"']*)["'][^>]*>[ \t]*\n([\s\S]*?)^[ \t]*<\/Tab>[ \t]*\n?/gm;
      const sections: string[] = [];
      let match = tab.exec(body);
      while (match !== null) {
        sections.push(`#### ${match[1]}\n\n${dedent(match[2])}`);
        match = tab.exec(body);
      }
      // A `<Tabs>` we cannot take apart is left exactly as it was, rather than
      // flattened into something we have not checked.
      return sections.length > 0 ? sections.join("\n") : all;
    },
  );

  return out;
}
