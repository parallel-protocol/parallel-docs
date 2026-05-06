import "./Footer.css";

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: "Resources",
    links: [
      { text: "Landing Page", href: "https://parallel.best/" },
      { text: "App", href: "https://app.parallel.best/" },
      { text: "Brand Assets", href: "https://brand.parallel.best/" },
      { text: "Github", href: "https://github.com/parallel-protocol/" },
    ],
  },
  {
    heading: "Follow",
    links: [
      { text: "Blog", href: "https://blog.parallel.best/" },
      { text: "X", href: "https://x.com/ParallelMoney" },
      { text: "Telegram", href: "https://t.me/parallel_money" },
      { text: "Discord", href: "https://discord.gg/vuuAVAxpcF" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="cooper-footer-bleed"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="cooper-footer">
        {COLUMNS.map((col) => (
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
