/**
 * Truncate an Ethereum-style address to `head` leading + `tail` trailing chars,
 * joined with a Unicode ellipsis. Returns the address unchanged when it is
 * already shorter than `head + tail`.
 *
 * @example truncateAddress("0x1234567890abcdef1234567890abcdefabcdef12") // "0x1234…ef12"
 */
export function truncateAddress(addr: `0x${string}`, head = 6, tail = 4): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/**
 * Format an ISO-8601 date string as a short, human-readable date
 * (e.g. `"Nov 20, 2025"` for `en-US`). Throws if the input cannot be parsed.
 */
export function formatDate(iso: string, locale = "en-US"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${iso}`);
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Build a short initials string from a name, preserving the original case of
 * each word's leading character. Useful as a fallback logo glyph.
 *
 * @example getInitials("Trail of Bits") // "ToB"
 * @example getInitials("OpenZeppelin")  // "O"
 */
export function getInitials(name: string, max = 3): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words
    .slice(0, max)
    .map((w) => w[0] ?? "")
    .join("");
}
