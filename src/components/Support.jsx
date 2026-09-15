/**
 * Блок поддержки. ⚠️ Ссылки-заглушки: замените на реальные адреса
 * своих Boosty / Patreon / соцсетей.
 */
const PLATFORMS = [
  {
    id: 'boosty',
    name: 'Boosty',
    href: 'https://boosty.to',
    tone: 'ember',
    text: 'Ежемесячная поддержка без посредников.',
    icon: '◈',
  },
  {
    id: 'patreon',
    name: 'Patreon',
    href: 'https://patreon.com',
    tone: 'gold',
    text: 'Доступ к эксклюзивным материалам и отрисовкам.',
    icon: '◆',
  },
  {
    id: 'social',
    name: 'Соцсети',
    href: 'https://t.me',
    tone: 'ice',
    text: 'Новости, наброски и анонсы глав.',
    icon: '✶',
  },
];

export default function Support() {
  return (
    <section className="section support" id="support">
      <div className="container">
        <div className="section-title-wrap">
          <p className="meta">04 — Поддержать</p>
          <h2 className="section-title">Поддержать проект</h2>
        </div>

        <ul className="support__grid">
          {PLATFORMS.map((p) => (
            <li key={p.id} className={`support-card support-card--${p.tone}`}>
              <a
                className="support-card__link"
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="support-card__icon" aria-hidden="true">
                  {p.icon}
                </span>
                <h3 className="support-card__name">{p.name}</h3>
                <p className="support-card__text">{p.text}</p>
                <span className="support-card__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}