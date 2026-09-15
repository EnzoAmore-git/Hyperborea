import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getLenis } from '../animations/lenis.js';

const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export default function Hero() {
  const [videoFailed, setVideoFailed] = useState(false);

  const scrollToAbout = (e) => {
    e.preventDefault();
    const lenis = getLenis();
    if (lenis && document.querySelector('#about')) {
      lenis.scrollTo('#about', { offset: -80, duration: 1.2 });
    }
  };

  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden="true">
        {!videoFailed ? (
          <video
            className="hero__video"
            src={asset('/video/bg.mp4')}
            poster={asset('/images/hero-poster.webp')}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <img
            className="hero__poster"
            src={asset('/images/hero-poster.webp')}
            alt=""
            fetchPriority="high"
          />
        )}
        <div className="hero__overlay" />
      </div>

      <div className="hero__content container">
        <p className="hero__eyebrow meta">Славянское фэнтези · Веб-комикс</p>
        <h1 className="hero__title">Hyperborea</h1>
        <p className="hero__lead">
          Мир, где тёмные башни стоят как кости мёртвого бога, а ветер
          приносит запах дыма и железа. Откройте артбук и первую главу.
        </p>
        <div className="hero__actions">
          <Link to="/read/1/1" className="btn btn--primary">
            Читать комикс
          </Link>
          <a href="#about" className="btn btn--ghost" onClick={scrollToAbout}>
            О проекте
          </a>
        </div>
      </div>
    </section>
  );
}