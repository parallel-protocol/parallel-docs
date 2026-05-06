import "./PageHeader.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  breadcrumb: BreadcrumbItem[];
  title?: string;
  subtitle?: string | null;
}

/**
 * Page header inspiré du layout GitBook : `<header>` regroupant
 * breadcrumb + H1 + subtitle dans un seul bloc avec `clear-both` pour
 * la prochaine ligne de contenu.
 *
 * Le H1 est rendu ici (Vocs ne l'auto-rend pas dans le body, juste
 * dans `<head><title>`). Si `title` est absent, on skip le H1 et le
 * H1 markdown du body sera rendu naturellement.
 */
export function PageHeader({ breadcrumb, title, subtitle }: PageHeaderProps) {
  const hasBreadcrumb = breadcrumb.length > 0;
  const hasTitle = Boolean(title && title.trim().length > 0);
  const hasSubtitle = Boolean(subtitle && subtitle.trim().length > 0);
  if (!hasBreadcrumb && !hasTitle && !hasSubtitle) return null;

  return (
    <header className="cooper-page-header">
      {hasBreadcrumb && (
        <nav className="cooper-page-header-breadcrumb" aria-label="Breadcrumb">
          <ol className="cooper-page-header-breadcrumb-list">
            {breadcrumb.map((item, i) => (
              <li key={`${item.label}-${i}`} className="cooper-page-header-breadcrumb-item">
                {item.href ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <span>{item.label}</span>
                )}
                {i < breadcrumb.length - 1 && (
                  <span
                    className="cooper-page-header-separator"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {hasTitle && <h1 className="cooper-page-header-title">{title}</h1>}
      {hasSubtitle && <p className="cooper-page-header-subtitle">{subtitle}</p>}
    </header>
  );
}

export default PageHeader;
