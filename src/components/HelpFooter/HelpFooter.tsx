import "./HelpFooter.css";

/**
 * Help block shown at the bottom of builder docs pages.
 * "Stuck? Discord · GitHub · Email" — wired with the Parallel community links.
 */
export function HelpFooter() {
  return (
    <aside className="help-footer" aria-label="Get help">
      <strong>Stuck?</strong>{" "}
      <a href="https://discord.gg/vuuAVAxpcF" target="_blank" rel="noreferrer">
        Ask in #builders on Discord
      </a>{" "}
      ·{" "}
      <a href="https://github.com/parallel-protocol" target="_blank" rel="noreferrer">
        Open a GitHub Discussion
      </a>{" "}
      · <a href="mailto:builders@parallel.best">builders@parallel.best</a>
    </aside>
  );
}
