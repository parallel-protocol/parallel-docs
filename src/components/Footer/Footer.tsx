import "./Footer.css";

export interface FooterLink {
  text: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface FooterProps {
  /**
   * Columns to render. The component is config-driven so each docs-X repo
   * can supply its own column layout in `docs/layout.tsx` without touching
   * the shared component code.
   */
  columns: FooterColumn[];
}

/**
 * Site footer — full-viewport-width tinted band, rendered at the root of
 * `docs/layout.tsx` so it spans below the entire DocsLayout (sidebar +
 * content + outline).
 *
 * The CSS adapts the column count automatically:
 *   - desktop (≥ 1080px) : N columns side-by-side
 *   - tablet  (≥ 720px)  : 2 columns
 *   - mobile  (< 720px)  : 1 column stacked
 */
export default function Footer({ columns }: FooterProps) {
  if (columns.length === 0) return null;

  return (
    <footer
      className="cooper-footer-bleed"
      role="contentinfo"
      aria-label="Site footer"
      data-cols={columns.length}
    >
      <div className="cooper-footer">
        {columns.map((col) => (
          <div key={col.heading} className="cooper-footer-column">
            <h2 className="cooper-footer-heading">{col.heading}</h2>
            <ul className="cooper-footer-list">
              {col.links.map((link) => (
                <li key={link.href}>
                  <a
                    className="cooper-footer-link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
