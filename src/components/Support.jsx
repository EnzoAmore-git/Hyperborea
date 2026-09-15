/**
 * Блок поддержки. ⚠️ Boosty / Patreon — ссылки-заглушки: замените на реальные.
 * Телеграм-канал взят из артбука проекта.
 */
import SectionTitle from './SectionTitle.jsx';

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
    id: 'telegram',
    name: 'Телеграм-канал',
    href: 'https://t.me/artzavtrakartiomzhukov',
    tone: 'ice',
    text: 'Подписывайтесь: наброски, новости и анонсы глав.',
    icon: '✶',
  },
];

export default function Support() {
  return (
    <section className="section support" id="support">
      <div className="container">
        <SectionTitle num="04 — Поддержать" title="Поддержать проект" />

        <ul className="support__grid" data-reveal-group>
          {PLATFORMS.map((p) => (
            <li
              key={p.id}
              className={`support-card support-card--${p.tone}`}
              data-reveal-child
            >
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