import { ChevronRight } from "lucide-react";
import "./LinkCard.css";

export interface LinkCardProps {
  /** External URL the card links to (opens in new tab). */
  href: string;
  /** Page title (typically the og:title of the target). Falls back to hostname. */
  title?: string;
  /** Absolute URL to the favicon (typically apple-touch-icon). Hidden when absent. */
  favicon?: string;
  /** Display hostname (without TLD/www). Computed from href if absent. */
  hostname?: string;
  /** Optional 1-line description shown under the title. */
  description?: string;
}

function deriveHostname(rawUrl: string): string {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./i, "");
    const parts = host.split(".");
    return parts.length <= 1 ? host : parts.slice(0, -1).join(".");
  } catch {
    return rawUrl;
  }
}

/**
 * Card cliquable pour mettre en avant un lien externe (équivalent visuel
 * du `{% embed %}` GitBook). Rend favicon + og:title + hostname court +
 * chevron, hover ring sur la border (matching le rendu GitBook).
 *
 * Les méta (`title`, `favicon`, `hostname`) sont fournis par le transformer
 * `embeds.ts` qui fetch l'URL au build via `embedMeta.ts`. Quand `title`
 * est absent, on rend le hostname court à sa place — pas de doublon.
 */
export function LinkCard({ href, title, favicon, hostname, description }: LinkCardProps) {
  const computedHost = hostname ?? deriveHostname(href);
  const displayTitle = title ?? computedHost;
  // Show hostname line below title only when a real title is rendered above
  // (otherwise it'd just duplicate the hostname).
  const showHostnameLine = Boolean(title);

  return (
    <a className="cooper-lc-card" href={href} target="_blank" rel="noopener noreferrer">
      {favicon && (
        <img
          className="cooper-lc-favicon"
          src={favicon}
          alt=""
          width={20}
          height={20}
          loading="lazy"
        />
      )}
      <span className="cooper-lc-body">
        <span className="cooper-lc-title">{displayTitle}</span>
        {description && <span className="cooper-lc-description">{description}</span>}
        {showHostnameLine && <span className="cooper-lc-host">{computedHost}</span>}
      </span>
      <ChevronRight className="cooper-lc-icon" aria-hidden="true" size={16} />
    </a>
  );
}

export default LinkCard;
