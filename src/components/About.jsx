const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="section-title-wrap">
          <p className="meta">01 — О проекте</p>
          <h2 className="section-title">О проекте</h2>
        </div>

        <div className="about__grid">
          <div className="about__text">
            <p>
              <strong>Hyperborea</strong> — цифровой артбук и веб-комикс в жанре
              славянского фэнтези. История о мире на грани рассвета: древние
              башни, стёртые боги и люди, которые решают, чьей стороной встать,
              когда тьма начинает пожирать свет.
            </p>
            <p>
              Каждый разворот — вручную раскадрованная сцена, каждый персонаж —
              отдельная концепт-работа. Проект рассказывается иллюстрациями,
              шёпотом фонов и тишиной между страницами.
            </p>
            <p className="about__note meta">
              18+ · Темы: война, мифы, взросление через потерю
            </p>
          </div>

          <figure className="about__media">
            <img
              src={asset('/images/art/art-09.jpg')}
              alt="Концепт-арт мира Hyperborea"
              loading="lazy"
              decoding="async"
            />
            <div className="about__media-shade" aria-hidden="true" />
            <figcaption className="meta">Руины башни Аргана</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}