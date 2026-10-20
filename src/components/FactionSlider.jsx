import { useCallback, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../animations/timing.js';

const SCROLL_SETTLE_MS = 140;

/**
 * Полноэкранный слайдер изображений выбранной фракции: нативный
 * горизонтальный скролл со snap (свайп на тач), стрелки, точки-индикаторы
 * и управление с клавиатуры (← →). Снизу — затемнение и текст фракции.
 */
export default function FactionSlider({ faction, index, onIndexChange }) {
  const trackRef = useRef(null);
  const settleTimer = useRef(0);
  const slides = faction.images;
  const count = slides.length;

  const scrollToIndex = useCallback((i) => {
    const track = trackRef.current;
    const slide = track?.children[i];
    if (!track || !slide) return;
    const target = slide.offsetLeft - track.offsetLeft;
    if (Math.abs(track.scrollLeft - target) < 2) return;
    track.scrollTo({
      left: target,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  useEffect(() => {
    scrollToIndex(index);
  }, [index, scrollToIndex]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const handleScroll = () => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const track = trackRef.current;
      const first = track?.children[0];
      if (!track || !first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const stride = first.offsetWidth + gap;
      if (stride <= 0) return;
      const next = Math.max(0, Math.min(count - 1, Math.round(track.scrollLeft / stride)));
      if (next !== index) onIndexChange(next);
    }, SCROLL_SETTLE_MS);
  };

  const go = (dir) => onIndexChange(Math.max(0, Math.min(count - 1, index + dir)));

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  return (
    <div
      className="faction-slider"
      role="group"
      aria-roledescription="карусель"
      aria-label={`Изображения фракции «${faction.name}»`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="faction-slider__media">
        <ul className="faction-slider__track" ref={trackRef} onScroll={handleScroll}>
          {slides.map((image, i) => (
            <li className="faction-slide" key={image.id}>
              <div className="faction-slide__wrapper">
                <img
                  className="faction-slide__img"
                  src={image.src || image.fallback}
                  alt={image.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="faction-slider__dots">
          {slides.map((image, i) => (
            <button
              key={image.id}
              type="button"
              className={`faction-slider__dot${i === index ? ' is-active' : ''}`}
              aria-label={`Изображение ${i + 1} из ${count}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => onIndexChange(i)}
            />
          ))}
        </div>
      </div>

      <div className="faction-slider__overlay">
        <div className="faction-slider__caption">
          <h3 className="faction-slider__name" style={{ color: faction.color }}>
            {faction.name}
          </h3>
          <p className="faction-slider__desc">{faction.description}</p>
        </div>
      </div>

      <button
        type="button"
        className="faction-slider__arrow faction-slider__arrow--prev"
        aria-label="Предыдущее изображение"
        disabled={index === 0}
        onClick={() => go(-1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        className="faction-slider__arrow faction-slider__arrow--next"
        aria-label="Следующее изображение"
        disabled={index === count - 1}
        onClick={() => go(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}