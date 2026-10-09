import SectionTitle from './SectionTitle.jsx';

const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <SectionTitle num="01 — О проекте" title="О проекте" />

        <div className="about__grid" data-reveal>
          <div className="about__text">
            <p>
              <strong>Гиперборея: Легенда о Северном Царстве</strong> —
              славянское боевое фэнтези с элементами киберпанка
            </p>
            <p>
              Герои живут в мире, где корпорации заменили государство,
              частные армии — полицию, а древние мифы оказались реальностью.
              Кто-то превращает людей в мутантов-оборотней и устраивает
              массовые похищения детей-сирот из интернатов
            </p>
            <p>
              Капитан Святослав — наследник древних богатырей, хоть вместо
              кольчуги он и носит военный камуфляж, а вместо меча и щита —
              современное оружие. Расследуя исчезновение детей, он спускается
              в подземный мир города и постепенно выходит на след одной из
              ведущих биотехнологических корпораций
            </p>
            <p>
              В ходе расследования и боевых столкновений Святославу предстоит
              узнать, что мутанты — лишь часть куда более древней истории,
              а война за будущее человечества началась задолго до его
              рождения
            </p>
            <p className="about__note meta">
              18+ · Тёмное фэнтези · Киберпанк · Война · Мифология
            </p>
          </div>

          <figure className="about__media" data-parallax="10">
            <picture>
              <source
                type="image/webp"
                srcSet={`${asset('/images/art/webp/art-09-400.webp')} 400w, ${asset('/images/art/webp/art-09-800.webp')} 800w, ${asset('/images/art/webp/art-09-1200.webp')} 1200w`}
                sizes="(min-width: 1024px) 480px, 100vw"
              />
              <img
                src={asset('/images/art/art-09.jpg')}
                alt="Концепт-арт мира Гиперборея"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="about__media-shade" aria-hidden="true" />
            <figcaption className="meta">Глава 2. «Мутанты» — заброшенные кварталы внешнего города</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}