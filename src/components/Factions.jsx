import { useState } from 'react';
import { factions, factionTabs } from '../data/factions.js';
import SectionTitle from './SectionTitle.jsx';
import GalleryFilter from './GalleryFilter.jsx';
import FactionSlider from './FactionSlider.jsx';

/**
 * Блок «Фракции»: сверху — переключатель фракций, снизу — полноэкранный
 * слайдер из изображений выбранной фракции. При смене фракции слайдер
 * пересоздаётся (key) и возвращается к первому изображению.
 */
export default function Factions() {
  const [factionIndex, setFactionIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const activeFaction = factions[factionIndex];

  const handleFactionChange = (id) => {
    const i = factions.findIndex((f) => f.id === id);
    if (i < 0 || i === factionIndex) return;
    setFactionIndex(i);
    setImageIndex(0);
  };

  return (
    <section className="section factions" id="factions">
      <div className="container">
        <SectionTitle num="02 — Фракции" title="Фракции" />
      </div>

      <div className="factions__tabs">
        <GalleryFilter
          characters={factionTabs}
          active={activeFaction.id}
          onChange={handleFactionChange}
          ariaLabel="Выбор фракции"
        />
      </div>

      <FactionSlider
        key={activeFaction.id}
        faction={activeFaction}
        index={imageIndex}
        onIndexChange={setImageIndex}
      />
    </section>
  );
}
