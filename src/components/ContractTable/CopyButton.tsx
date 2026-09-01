"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const COPIED_RESET_MS = 1500;

/**
 * Copy-to-clipboard control for a single address.
 *
 * Split out of `ContractTable` so the table itself can render on the server:
 * this button is the only part that needs client state, and keeping it isolated
 * means every contract address ships in the prerendered HTML.
 */
export function CopyButton({ address }: { address: `0x${string}` }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, COPIED_RESET_MS);
    } catch {
      // Clipboard unavailable; leave UI unchanged.
    }
  }, [address]);

  return (
    <>
      <button
        type="button"
        className="cooper-ct-copy"
        data-copied={copied}
        onClick={handleCopy}
        aria-label={`Copy address ${address}`}
      >
        {copied ? (
          <Check size={14} aria-hidden="true" focusable="false" />
        ) : (
          <Copy size={14} aria-hidden="true" focusable="false" />
        )}
      </button>
      <span className="cooper-sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}
