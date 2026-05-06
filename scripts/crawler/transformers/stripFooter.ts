import type { Transformer } from "../types";

const FOOTER_REGEX =
  /\n*---\n+#\s+Agent Instructions:\s+Querying This Documentation[\s\S]*$/;

export const stripFooter: Transformer = {
  name: "stripFooter",
  apply: (source: string) => source.replace(FOOTER_REGEX, ""),
};
