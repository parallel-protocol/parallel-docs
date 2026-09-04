/**
 * Shared SVG sprite for the contract-address tables.
 *
 * A contract-addresses page lists a few hundred contracts, and every row used to
 * inline two full lucide `<svg>` elements (copy + external link). On the USDp
 * page that was 420 inline SVGs and the bulk of an 872 KB HTML document, for
 * exactly three distinct shapes.
 *
 * So the geometry is declared once per page as `<symbol>`s and each row
 * references one with `<use>`. The path data below is copied verbatim from
 * lucide-react v0.469.0 (`icons/copy.js`, `icons/check.js`,
 * `icons/external-link.js`) with lucide's `defaultAttributes`, so the rendering
 * is identical to the components it replaces.
 *
 * Both exports render on the server: no hooks, no client state.
 */

/** Icons available in the sprite. Keep in sync with the `<symbol>` ids below. */
export type IconName = "copy" | "check" | "external-link";

/**
 * The sprite itself: hidden, inert, and rendered exactly once per page
 * (see `ContractAddressesPage`). Without it, every `<use>` on the page resolves
 * to nothing and the icons disappear.
 */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <symbol
        id="cooper-icon-copy"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </symbol>
      <symbol
        id="cooper-icon-check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </symbol>
      <symbol
        id="cooper-icon-external-link"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </symbol>
    </svg>
  );
}

/** Props for `<Icon>`. */
export interface IconProps {
  /** Which sprite symbol to draw. */
  name: IconName;
  /** Rendered edge length in px. Defaults to 14, matching the table's icon size. */
  size?: number;
}

/**
 * One icon, drawn by referencing the page's sprite.
 *
 * Purely decorative: the surrounding button or link carries the accessible name,
 * so the icon is hidden from assistive tech and removed from the tab order.
 */
export function Icon({ name, size = 14 }: IconProps) {
  return (
    <svg className="cooper-ct-icon" width={size} height={size} aria-hidden="true" focusable="false">
      <use href={`#cooper-icon-${name}`} />
    </svg>
  );
}
