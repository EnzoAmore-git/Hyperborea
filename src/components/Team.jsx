import { team } from '../data/team.js';
import SectionTitle from './SectionTitle.jsx';

const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export default function Team() {
  return (
    <section className="section team" id="team">
      <div className="container">
        <SectionTitle num="03 — Команда" title="Команда" />

        <ul className="team__grid" data-reveal-group>
          {team.map((m) => (
            <li key={m.id} className="team-card" data-reveal-child>
              <div className="team-card__avatar" aria-hidden="true">
                {m.photo ? (
                  <img
                    className="team-card__photo"
                    src={asset(`${m.photo}-352.webp`)}
                    srcSet={`${asset(`${m.photo}-176.webp`)} 176w, ${asset(`${m.photo}-352.webp`)} 352w`}
                    sizes="88px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span>{m.initials}</span>
                )}
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
