import "./HelpFooter.css";

/**
 * Help block shown at the bottom of builder docs pages.
 */
export function HelpFooter() {
  return (
    <aside className="help-footer" aria-label="Get help">
      <strong>Stuck?</strong>{" "}
      <a href="https://t.me/parallel_money" target="_blank" rel="noreferrer">
        Ask on Telegram
      </a>{" "}
      ·{" "}
      <a href="https://gov.parallel.best/" target="_blank" rel="noreferrer">
        Post on the governance forum
      </a>
    </aside>
  );
}
