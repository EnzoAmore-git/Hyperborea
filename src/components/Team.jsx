import { team } from '../data/team.js';
import SectionTitle from './SectionTitle.jsx';

export default function Team() {
  return (
    <section className="section team" id="team">
      <div className="container">
        <SectionTitle num="03 — Команда" title="Команда" />

        <ul className="team__grid" data-reveal-group>
          {team.map((m) => (
            <li key={m.id} className="team-card" data-reveal-child>
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