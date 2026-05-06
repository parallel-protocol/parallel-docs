import { ArrowRight } from "lucide-react";
import { formatDate, getInitials } from "../../lib/utils";
import "./AuditCard.css";

/** Props for `<AuditCard>`. */
export interface AuditCardProps {
  /** Display name of the auditing firm (e.g. `"Trail of Bits"`). */
  auditor: string;
  /** Optional URL to a square logo image rendered at 40×40 px. Falls back to initials. */
  auditorLogo?: string;
  /** ISO-8601 date string for when the audit was completed (or kicked off, when `status === "ongoing"`). */
  date: string;
  /** Optional list of in-scope items shown as a bulleted list (e.g. contracts, modules). */
  scope?: string[];
  /** URL to the published audit report. The whole card is wrapped in this link. */
  report: string;
  /** Audit lifecycle. `"ongoing"` swaps the date for an "In progress" badge. Defaults to `"completed"`. */
  status?: "completed" | "ongoing";
}

/**
 * Visual card linking out to a third-party audit report.
 *
 * - The entire card is a single `<a target="_blank" rel="noopener noreferrer">` for one-click access.
 * - Renders an auditor logo when `auditorLogo` is provided, otherwise a circular initials glyph.
 * - The top-right corner shows the formatted audit date, or an "In progress" badge when `status === "ongoing"`.
 * - An optional bulleted `scope` list summarises what was audited.
 * - The "View Report" CTA arrow nudges right on hover/focus.
 */
export function AuditCard({
  auditor,
  auditorLogo,
  date,
  scope,
  report,
  status = "completed",
}: AuditCardProps) {
  const formattedDate = formatDate(date);
  const isOngoing = status === "ongoing";
  const ariaLabel = `Read ${auditor} audit report from ${formattedDate}`;

  return (
    <a
      className="cooper-ac-card"
      href={report}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
    >
      <div className="cooper-ac-header">
        {auditorLogo ? (
          <img className="cooper-ac-logo" src={auditorLogo} alt={auditor} width={40} height={40} />
        ) : (
          <span className="cooper-ac-initials" aria-hidden="true">
            {getInitials(auditor)}
          </span>
        )}
        <div className="cooper-ac-heading">
          <span className="cooper-ac-auditor">{auditor}</span>
        </div>
        {isOngoing ? (
          <span className="cooper-ac-badge">In progress</span>
        ) : (
          <time className="cooper-ac-date" dateTime={date}>
            {formattedDate}
          </time>
        )}
      </div>

      {scope && scope.length > 0 && (
        <ul className="cooper-ac-scope">
          {scope.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <span className="cooper-ac-cta">
        View Report
        <ArrowRight className="cooper-ac-cta-icon" aria-hidden="true" size={16} />
      </span>
    </a>
  );
}

export default AuditCard;
