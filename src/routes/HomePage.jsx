import { useEffect } from 'react';
import Hero from '../components/Hero.jsx';
import About from '../components/About.jsx';
import Factions from '../components/Factions.jsx';
import Team from '../components/Team.jsx';
import Support from '../components/Support.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { initScrollReveal } from '../animations/scrollReveal.js';
import { initParallax } from '../animations/parallax.js';
import { setPageSeo } from '../lib/seo.js';

const HOME_SEO = {
  title: 'Гиперборея — Легенда о Северном Царстве',
  description: 'Гиперборея — «Легенда о Северном Царстве»: авторский веб-комикс и арт-бук в жанре городского тёмного фэнтези. Читайте главы онлайн.',
  type: 'website',
};

export default function HomePage() {
  useEffect(() => {
    setPageSeo(HOME_SEO);
    let cancelled = false;
    let stopReveal = () => {};
    let stopParallax = () => {};
    // Этап 7.2: gsap подключается лениво (вне критического пути первого экрана)
    initScrollReveal().then((stop) => { if (cancelled) stop(); else stopReveal = stop; });
    initParallax().then((stop) => { if (cancelled) stop(); else stopParallax = stop; });
    return () => {
      cancelled = true;
      stopReveal();
      stopParallax();
    };
  }, []);

  return (
    <div className="home-blocks">
      <Hero />
      <About />
      <ErrorBoundary label="Фракции не загрузились">
        <Factions />
      </ErrorBoundary>
      <Team />
      <Support />
    </div>
  );
}
