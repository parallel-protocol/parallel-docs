import type { ReactNode } from "react";
import Footer, { type FooterColumn } from "@/components/Footer/Footer";

// Vocs detects this file via `virtual:consumer-components` (see
// `vocs/_lib/vite/plugins/virtual-consumer-components.js`) and uses the
// default export to wrap the entire DocsLayout (sidebar + content + outline
// + prev/next nav). Placing the footer here puts it OUTSIDE the content
// column so it spans the full viewport width — matching the GitBook
// docs.parallel.best layout.
//
// The Footer is config-driven : each docs-X repo defines its own columns
// here without touching the shared component.
const COLUMNS: FooterColumn[] = [
  {
    heading: "Resources",
    links: [
      { text: "Landing Page", href: "https://parallel.best/" },
      { text: "App", href: "https://app.parallel.best/" },
      { text: "Brand Assets", href: "https://brand.parallel.best/" },
      { text: "Github", href: "https://github.com/parallel-protocol/" },
    ],
  },
  {
    heading: "Follow",
    links: [
      { text: "Blog", href: "https://blog.parallel.best/" },
      { text: "X", href: "https://x.com/ParallelMoney" },
      { text: "Telegram", href: "https://t.me/parallel_money" },
      { text: "Discord", href: "https://discord.gg/vuuAVAxpcF" },
    ],
  },
  {
    heading: "DAO",
    links: [
      { text: "Governance Forum", href: "https://gov.parallel.best/" },
      { text: "Vote", href: "https://vote.parallel.best/" },
    ],
  },
  {
    heading: "Others",
    links: [{ text: "Backup App", href: "https://app.parallel.credit/" }],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer columns={COLUMNS} />
    </>
  );
}
