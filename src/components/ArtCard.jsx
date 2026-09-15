import { motion } from 'framer-motion';
import { characterLabel } from '../data/gallery.js';
import { DURATION, EASING } from '../animations/timing.js';

export default function ArtCard({ art, onOpen }) {
  return (
    <motion.figure
      className="art-card"
      layout
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: DURATION.medium / 1000, ease: EASING.smooth }}
      style={
        art.lqip
          ? {
              backgroundImage: `url("${art.lqip}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <picture>
        <source
          type="image/webp"
          srcSet={art.srcset}
          sizes="(min-width: 1024px) 300px, (min-width: 768px) 240px, 92vw"
        />
        <img
          className="art-card__img"
          src={art.src}
          alt={art.caption}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <button
        type="button"
        className="art-card__btn"
        aria-label={`Открыть «${art.caption}» на весь экран`}
        onClick={() => onOpen(art)}
      />
      <figcaption className="art-card__caption">
        <span className="art-card__title">{art.caption}</span>
        <span className="art-card__char meta">
          {characterLabel(art.character)}
        </span>
      </figcaption>
    </motion.figure>
  );
}