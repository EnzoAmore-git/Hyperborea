import { useEffect } from 'react';
import Hero from '../components/Hero.jsx';
import About from '../components/About.jsx';
import Gallery from '../components/Gallery.jsx';
import Team from '../components/Team.jsx';
import Support from '../components/Support.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { initScrollReveal } from '../animations/scrollReveal.js';
import { initParallax } from '../animations/parallax.js';

export default function HomePage() {
  useEffect(() => {
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
    <>
      <Hero />
      <About />
      <ErrorBoundary label="Галерея не загрузилась">
        <Gallery />
      </ErrorBoundary>
      <Team />
      <Support />
    </>
  );
}