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
              <strong>Hyperborea</strong> — «Легенда о Северном Царстве»:
              славянское тёмное фэнтези в декорациях недалёкого будущего.
              Корпорации заменили государства, «безопасники» — полицию,
              а ночные улицы всё чаще принадлежат волчьим тварям.
            </p>
            <p>
              Всё началось с Луча Чистого Света, расколовшего небо над
              городом. С тех пор тех, в ком спит генетический код «VOLK»,
              превращают в оборотней — и кто-то нажал на спусковой крючок
              для целой популяции.
            </p>
            <p>
              Капитан Святослав носит камуфляж, а не кольчугу, но предки
              заповедали потомкам идти в драку. По следам похищенных детей
              он спускается под землю — и выходит к тени корпорации
              «Алатырь-Оберег», прикрывшейся именем древнего оберега.
            </p>
            <p className="about__note meta">
              18+ · Темы: война, генетика, мифы, взросление через потерю
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
                alt="Концепт-арт мира Hyperborea"
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