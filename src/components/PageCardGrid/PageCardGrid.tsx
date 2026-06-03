import { ChevronRight } from "lucide-react";
import "./PageCardGrid.css";

export interface PageCardItem {
  /** Card title — typically the child page's H1. */
  title: string;
  /** Internal route the card links to. */
  href: string;
}

export interface PageCardGridProps {
  items: PageCardItem[];
}

/**
 * Grid de cards "immediate-children" pour les pages parentes auto-TOC.
 *
 * Sur GitBook, une page parente sans contenu rédactionnel rend
 * automatiquement une grille de cards listant uniquement ses enfants
 * directs. Vocs n'ayant pas d'équivalent natif, on injecte ce composant
 * via le transformer `pageIndexCards` (cf. `scripts/crawler/transformers/`)
 * pour reproduire ce rendu.
 *
 * - Layout responsive : 3 cols ≥ 960px, 2 cols ≥ 640px, 1 col mobile
 * - Chaque card est un `<a>` complet cliquable, focus ring + hover lift
 * - Chevron `›` à droite, animation translateX au hover
 */
export function PageCardGrid({ items }: PageCardGridProps) {
  if (items.length === 0) return null;
  return (
    <ul className="cooper-pcg-grid" aria-label="Sections">
      {items.map((item) => (
        <li key={item.href} className="cooper-pcg-item">
          <a className="cooper-pcg-card" href={item.href}>
            <span className="cooper-pcg-title">{item.title}</span>
            <ChevronRight className="cooper-pcg-chevron" aria-hidden="true" size={18} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default PageCardGrid;
