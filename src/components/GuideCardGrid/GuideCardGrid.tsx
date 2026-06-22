import "./GuideCardGrid.css";

export interface GuideCardItem {
  /** Card title (typically the article's title). */
  title: string;
  /** External URL the card links to (opens in a new tab). */
  href: string;
  /** Cover image URL shown at the top of the card. */
  image: string;
  /** Optional 1-line description shown under the title. */
  description?: string;
}

export interface GuideCardGridProps {
  items: GuideCardItem[];
}

/**
 * Responsive grid of link cards with a cover image — used for the User Guides
 * page to surface the blog how-to articles. 3 cols ≥ 960px, 2 ≥ 640px, 1 on
 * mobile. Each card is a full <a> opening the article in a new tab.
 */
export function GuideCardGrid({ items }: GuideCardGridProps) {
  if (items.length === 0) return null;
  return (
    <div className="guide-card-grid">
      {items.map((it) => (
        <a
          key={it.href}
          className="guide-card"
          href={it.href}
          target="_blank"
          rel="noreferrer"
        >
          <div className="guide-card-image">
            <img src={it.image} alt="" loading="lazy" />
          </div>
          <div className="guide-card-body">
            <span className="guide-card-title">{it.title}</span>
            {it.description ? (
              <span className="guide-card-desc">{it.description}</span>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}
