import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { characters, filterByCharacter } from '../data/gallery.js';
import SectionTitle from './SectionTitle.jsx';
import GalleryFilter from './GalleryFilter.jsx';
import ArtCard from './ArtCard.jsx';
import Lightbox from './Lightbox.jsx';

export default function Gallery() {
  const [activeChar, setActiveChar] = useState('char-a');
  const [selected, setSelected] = useState(null);

  const items = filterByCharacter(activeChar);

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
            onChange={setActiveChar}
          />
        </aside>

        <div className="gallery__grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((art) => (
              <ArtCard key={art.id} art={art} onOpen={setSelected} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <Lightbox art={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}