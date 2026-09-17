import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION, EASING } from '../animations/timing.js';
import { useFocusTrap } from '../lib/focusTrap.js';
import { characterLabel } from '../data/gallery.js';

/**
 * Лайтбокс с навигацией «как в комиксе»: счётчик, ← →, клавиатура.
 * Кнопки: закрыть — в привычном углу, масштаб — иконка «лупа + плюс».
 */
export default function Lightbox({ items, index, onNavigate, onClose }) {
  const closeRef = useRef(null);
  const boxRef = useRef(null);
  const prevActive = useRef(null);
  const [zoomed, setZoomed] = useState(false);

  const art = items[index];
  const total = items.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  useFocusTrap({
    active: true,
    rootRef: boxRef,
    initialFocusRef: closeRef,
    inertSelectors: ['.navbar', '.site-footer'],
  });

  useEffect(() => {
    prevActive.current = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь')
        setZoomed((z) => !z);
      if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && hasPrev) {
        e.preventDefault();
        onNavigate(index - 1);
      }
      if ((e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') && hasNext) {
        e.preventDefault();
        onNavigate(index + 1);
      }
    };

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevActive.current?.focus?.();
    };
  }, [onClose, onNavigate, index, hasPrev, hasNext]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <motion.div
      ref={boxRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={art.caption}
      onClick={handleBackdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.medium / 1000, ease: EASING.smooth }}
    >
      <figure className="lightbox__inner">
        <AnimatePresence mode="wait">
          <motion.picture
            key={art.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast / 1000, ease: EASING.standard }}
          >
            {art.srcset && (
              <source
                type="image/webp"
                srcSet={art.srcset}
                sizes={zoomed ? '94vw' : 'min(92vw, 860px)'}
              />
            )}
            <img
              className={`lightbox__img${zoomed ? ' is-zoomed' : ''}`}
              src={art.src}
              alt={art.caption}
            />
          </motion.picture>
        </AnimatePresence>

        <figcaption className="lightbox__caption">
          <span className="lightbox__title">{art.caption}</span>
          <span className="meta">{characterLabel(art.character)}</span>
        </figcaption>

        {/* управление: закрыть и масштаб */}
        <div className="lightbox__controls">
          <button
            type="button"
            className={`lightbox__btn${zoomed ? ' is-active' : ''}`}
            aria-label="Масштаб (M)"
            onClick={() => setZoomed((z) => !z)}
          >
            <svg className="lightbox__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <line x1="14.6" y1="14.6" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            ref={closeRef}
            className="lightbox__btn lightbox__btn--close"
            aria-label="Закрыть (Esc)"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* навигация: счётчик + стрелки */}
        <div className="lightbox__nav">
          <button
            type="button"
            className="lightbox__nav-btn"
            aria-label="Предыдущий концепт"
            disabled={!hasPrev}
            onClick={() => onNavigate(index - 1)}
          >
            ←
          </button>
          <div className="lightbox__counter meta" role="status">
            {index + 1} <span className="lightbox__counter-sep">/</span> {total}
          </div>
          <button
            type="button"
            className="lightbox__nav-btn"
            aria-label="Следующий концепт"
            disabled={!hasNext}
            onClick={() => onNavigate(index + 1)}
          >
            →
          </button>
        </div>
      </figure>
    </motion.div>
  );
}