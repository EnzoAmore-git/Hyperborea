const FOOTER_LINKS = [
  { label: 'О проекте', href: '#about' },
  { label: 'Концепты', href: '#gallery' },
  { label: 'Команда', href: '#team' },
  { label: 'Поддержать', href: '#support' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__rune" aria-hidden="true">
            ◈
          </span>
          <span className="meta">Гиперборея</span>
        </div>

        <nav className="site-footer__links" aria-label="Навигация в футере">
          {FOOTER_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <p className="site-footer__copy meta">
          © {year} Гиперборея · Все права защищены
        </p>

        <div className="age-disclaimer">
          <span className="age-disclaimer__badge" aria-hidden="true">
            18+
          </span>
          <span className="age-disclaimer__text meta">
            Контент предназначен для лиц старше 18 лет
          </span>
        </div>
      </div>
    </footer>
  );
}