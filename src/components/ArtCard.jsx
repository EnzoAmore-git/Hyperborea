import { characterLabel } from '../data/gallery.js';

export default function ArtCard({ art, onOpen }) {
  return (
    <figure className="art-card">
      <img
        className="art-card__img"
        src={art.src}
        alt={art.caption}
        loading="lazy"
        decoding="async"
      />
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
    </figure>
  );
}