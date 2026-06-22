import "./PdfLink.css";

export interface PdfLinkProps {
  /** URL of the PDF (opens in a new tab). */
  href: string;
  /** File name shown next to the PDF icon. */
  label: string;
}

/**
 * A PDF download link rendered as a small PDF icon + the file name, opening
 * the document in a new tab — mirrors how GitBook surfaces uploaded files.
 */
export function PdfLink({ href, label }: PdfLinkProps) {
  return (
    <a className="pdf-link" href={href} target="_blank" rel="noreferrer">
      <svg
        className="pdf-link-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13h6M9 17h6" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
