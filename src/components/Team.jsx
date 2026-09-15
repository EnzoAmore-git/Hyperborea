import { team } from '../data/team.js';

export default function Team() {
  return (
    <section className="section team" id="team">
      <div className="container">
        <div className="section-title-wrap">
          <p className="meta">03 — Команда</p>
          <h2 className="section-title">Команда</h2>
        </div>

        <ul className="team__grid">
          {team.map((m) => (
            <li key={m.id} className="team-card">
              <div className="team-card__avatar" aria-hidden="true">
                <span>{m.initials}</span>
              </div>
              <div className="team-card__info">
                <h3 className="team-card__name">{m.name}</h3>
                <p className="team-card__role meta">{m.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}