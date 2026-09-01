"use client";

import { useEffect } from "react";

/**
 * Keeps the old `?chain=<slug>` deep links working.
 *
 * The page used to filter to one chain from that query parameter. Every chain
 * is now rendered at once, so an existing `?chain=base` link would simply land
 * at the top of the page. On mount this scrolls to that chain's section and
 * rewrites the URL to the anchor form, so old links still arrive where they
 * meant to. Purely an enhancement: with no JavaScript the content is all there.
 */
export function ChainDeepLink({ chains }: { chains: string[] }) {
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("chain");
    if (!requested || !chains.includes(requested)) return;

    const anchor = `chain-${requested}`;
    document.getElementById(anchor)?.scrollIntoView();
    window.history.replaceState(null, "", `#${anchor}`);
  }, [chains]);

  return null;
}
