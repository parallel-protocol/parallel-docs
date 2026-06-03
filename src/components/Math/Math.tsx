import "./Math.css";

export interface MathProps {
  /** Pre-rendered KaTeX HTML for a display-math block (see scripts/prerender-katex.mjs). */
  html: string;
}

/**
 * Renders a block formula from KaTeX HTML that was pre-rendered at author time.
 *
 * Vocs v2's MDX pipeline does not register remark-math's micromark syntax
 * extension, so `$$ … $$` blocks are converted to static KaTeX HTML by
 * `scripts/prerender-katex.mjs` and injected as `<Math html={…} />`. We use
 * `dangerouslySetInnerHTML` because the KaTeX markup uses string `style="…"`
 * attributes, which MDX/JSX would otherwise reject.
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: component intentionally named `Math` for use as the MDX `<Math>` tag.
export function Math({ html }: MathProps) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted build-time KaTeX output.
  return <div className="cooper-math" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default Math;
