import { AlertTriangle } from "lucide-react";
import "./LegacyBanner.css";

export interface LegacyBannerProps {
  /** Label for the current version link (e.g. "v3"). */
  targetVersion: string;
  /** Path to the current version docs (e.g. "/products/parallel-v3"). */
  targetLink: string;
}

export function LegacyBanner({ targetVersion, targetLink }: LegacyBannerProps) {
  return (
    <div role="note" className="cooper-legacy-banner">
      <AlertTriangle
        className="cooper-legacy-banner-icon"
        size={18}
        aria-hidden="true"
        focusable="false"
      />
      <p className="cooper-legacy-banner-text">
        You're reading the legacy v2 documentation. For current Parallel features, see{" "}
        <a href={targetLink}>{targetVersion}</a>.
      </p>
    </div>
  );
}
