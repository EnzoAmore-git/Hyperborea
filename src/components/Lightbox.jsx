import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DURATION, EASING } from '../animations/timing.js';
import { useFocusTrap } from '../lib/focusTrap.js';
import { characterLabel } from '../data/gallery.js';

export default function Lightbox({ art, onClose }) {
  const closeRef = useRef(null);
  const boxRef = useRef(null);
  const prevActive = useRef(null);
  const [zoomed, setZoomed] = useState(false);

  // Фокус-ловушка + inert на navbar/footer (DoD 6.1)
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
    };

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevActive.current?.focus?.();
    };
  }, [onClose]);

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
        <picture>
          {art.srcset && (
            <source
              type="image/webp"
              srcSet={art.srcset}
              sizes={zoomed ? '94vw' : 'min(92vw, 860px)'}
            />
          )}
          <motion.img
            className={`lightbox__img${zoomed ? ' is-zoomed' : ''}`}
            src={art.src}
            alt={art.caption}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: DURATION.slow / 1000, ease: EASING.smooth }}
          />
        </picture>

        <figcaption className="lightbox__caption">
          <span className="lightbox__title">{art.caption}</span>
          <span className="meta">{characterLabel(art.character)}</span>
        </figcaption>

        <div className="lightbox__controls">
          <button
            type="button"
            ref={closeRef}
            className="lightbox__btn"
            aria-label="Закрыть (Esc)"
            onClick={onClose}
          >
            ✕
          </button>
          <button
            type="button"
            className={`lightbox__btn${zoomed ? ' is-active' : ''}`}
            aria-label="Масштаб (M)"
            onClick={() => setZoomed((z) => !z)}
          >
            {zoomed ? '−' : '+'}
          </button>
        </div>
      </figure>
    </motion.div>
  );
}