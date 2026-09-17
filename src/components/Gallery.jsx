import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { characters, filterByCharacter, characterLabel } from '../data/gallery.js';
import SectionTitle from './SectionTitle.jsx';
import GalleryFilter from './GalleryFilter.jsx';
import ArtCard from './ArtCard.jsx';
import Lightbox from './Lightbox.jsx';
import { useColumns } from '../hooks/useColumns.js';

const ROWS_COLLAPSED = 3;
const LIMIT_PORTRAIT = 5;

export default function Gallery() {
  const [activeChar, setActiveChar] = useState('char-a');
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const cols = useColumns();

  const items = filterByCharacter(activeChar);
  const limit = cols === 1 ? LIMIT_PORTRAIT : cols * ROWS_COLLAPSED;
  const collapsed = !expanded && items.length > limit;
  const visible = collapsed ? items.slice(0, limit) : items;

  // при смене персонажа сетка всегда «сворачивается»
  const handleChange = (id) => {
    setActiveChar(id);
    setExpanded(false);
  };

  const selectedIndex = selected ? items.findIndex((a) => a.id === selected) : -1;

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <SectionTitle num="02 — Концепты" title="Концепты" />
      </div>

      <div className="container gallery__split">
        <aside className="gallery__filters">
          <GalleryFilter
            characters={characters}
            active={activeChar}
            onChange={handleChange}
          />
        </aside>

        <div className="gallery__grid-wrap">
          <p className="gallery__count meta" aria-live="polite">
            {characterLabel(activeChar)} · {items.length}
          </p>

          <div className="gallery__grid">
            <AnimatePresence initial={false}>
              {visible.map((art, i) => (
                <ArtCard
                  key={art.id}
                  art={art}
                  index={i}
                  onOpen={(a) => setSelected(a.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {collapsed && (
            <button
              type="button"
              className="gallery__toggle btn btn--ghost"
              onClick={() => setExpanded(true)}
            >
              Показать все · {items.length}
            </button>
          )}
          {expanded && items.length > limit && (
            <button
              type="button"
              className="gallery__toggle btn btn--ghost"
              onClick={() => setExpanded(false)}
            >
              Свернуть
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && selectedIndex >= 0 && (
          <Lightbox
            items={items}
            index={selectedIndex}
            onNavigate={(i) => setSelected(items[i]?.id ?? null)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}