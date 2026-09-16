/**
 * Данные галереи концептов.
 * Персонажи проставлены по тексту «Легенды о Северном Царстве» (Hyperborea).
 * ⚠️ Соответствие «арт → персонаж» временное: автору нужно уточнить по
 * реальным изображениям (модель изображения не видит).
 */

// Пути с префиксом базового пути (локально '/', на GH Pages '/Hyperborea/')
const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export const characters = [
  { id: 'char-a', label: 'Святослав' },
  { id: 'char-b', label: 'Святослав-Богатырь' },
  { id: 'char-c', label: 'Мутанты' },
  { id: 'char-d', label: 'Анна Орлова' },
  { id: 'landscape', label: 'Пейзаж' },
];

/** Имя персонажа по id (для подписи карточки) */
export const characterLabel = (id) =>
  characters.find((c) => c.id === id)?.label ?? id;

const RAW_GALLERY = [
  { id: '01', src: '/images/art/art-01.jpg', caption: 'Концепт-арт 01', character: 'landscape' },
  { id: '02', src: '/images/art/art-02.jpg', caption: 'Концепт-арт 02', character: 'char-a' },
  { id: '03', src: '/images/art/art-03.jpg', caption: 'Концепт-арт 03', character: 'char-a' },
  { id: '04', src: '/images/art/art-04.jpg', caption: 'Концепт-арт 04', character: 'char-b' },
  { id: '05', src: '/images/art/art-05.jpg', caption: 'Концепт-арт 05', character: 'landscape' },
  { id: '06', src: '/images/art/art-06.jpg', caption: 'Концепт-арт 06', character: 'char-b' },
  { id: '07', src: '/images/art/art-07.jpg', caption: 'Концепт-арт 07', character: 'char-c' },
  { id: '08', src: '/images/art/art-08.jpg', caption: 'Концепт-арт 08', character: 'char-c' },
  { id: '09', src: '/images/art/art-09.jpg', caption: 'Концепт-арт 09', character: 'landscape' },
  { id: '10', src: '/images/art/art-10.jpg', caption: 'Концепт-арт 10', character: 'char-d' },
  { id: '11', src: '/images/art/art-11.png', caption: 'Концепт-арт 11', character: 'char-d' },
  { id: '12', src: '/images/art/art-12.png', caption: 'Концепт-арт 12', character: 'char-a' },
  { id: '13', src: '/images/art/art-13.png', caption: 'Концепт-арт 13', character: 'char-b' },
  { id: '14', src: '/images/art/art-14.png', caption: 'Концепт-арт 14', character: 'char-c' },
  { id: '15', src: '/images/art/art-15.png', caption: 'Концепт-арт 15', character: 'char-d' },
  { id: '16', src: '/images/art/art-16.png', caption: 'Концепт-арт 16', character: 'char-a' },
  { id: '17', src: '/images/art/art-17.png', caption: 'Концепт-арт 17', character: 'char-b' },
  { id: '18', src: '/images/art/art-18.png', caption: 'Концепт-арт 18', character: 'char-c' },
  { id: '19', src: '/images/art/art-19.png', caption: 'Концепт-арт 19', character: 'char-d' },
];

/**
 * Заглушки галереи (этап «наполнение концептами»).
 * Пока реальных артов мало — каждый персонаж добивается SVG-заглушками до
 * PLACEHOLDERS_PER_CHAR штук, чтобы посмотреть сетку и переходы в нагруженном виде.
 * Удаляем этот блок по мере прихода реальных изображений.
 */
export const PLACEHOLDERS_PER_CHAR = 30;

const placeholderTheme = {
  'char-a': '#c4491c', // ржавый огонь
  'char-b': '#d8a23a', // янтарь
  'char-c': '#8c1f28', // кровь
  'char-d': '#7fa8b8', // холодный лёд
  landscape: '#8a7f6f', // земля
};

function placeholderSvg(characterId, n) {
  const label = characterLabel(characterId);
  const color = placeholderTheme[characterId] || '#c4491c';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <rect width="800" height="1200" fill="#14121c"/>
  <rect x="48" y="48" width="704" height="1104" rx="28" fill="${color}" opacity="0.14"/>
  <circle cx="400" cy="420" r="148" fill="${color}" opacity="0.22"/>
  <text x="400" y="748" text-anchor="middle" font-family="Georgia, serif" font-size="92" fill="${color}">${label}</text>
  <text x="400" y="840" text-anchor="middle" font-family="Inter, sans-serif" font-size="44" fill="#cfc8bb">концепт ${String(n).padStart(2, '0')}</text>
  <text x="400" y="898" text-anchor="middle" font-family="Inter, sans-serif" font-size="30" fill="#6b6154">заглушка</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const gallery = (() => {
  const real = RAW_GALLERY.map((g) => {
    const stem = g.src.replace(/^\/+/, '').replace(/\.(jpe?g|png)$/i, '');
    const base = import.meta.env.BASE_URL || '';
    const deriv = (w) =>
      `${base}${stem.replace('images/art', 'images/art/webp')}-${w}.webp`;
    return {
      ...g,
      src: asset(g.src),
      // WebP-производные (Этап 6.2): 400/800/1200 + LQIP 40px
      srcset: `${deriv(400)} 400w, ${deriv(800)} 800w, ${deriv(1200)} 1200w`,
      lqip: deriv(40),
    };
  });

  const byChar = {};
  for (const item of real) {
    (byChar[item.character] ||= []).push(item);
  }

  const placeholders = [];
  for (const c of characters) {
    const have = (byChar[c.id] || []).length;
    const needed = PLACEHOLDERS_PER_CHAR - have;
    for (let n = 1; n <= needed; n += 1) {
      const num = have + n;
      placeholders.push({
        id: `ph-${c.id}-${num}`,
        src: placeholderSvg(c.id, num),
        caption: `${c.label} — концепт ${String(num).padStart(2, '0')}`,
        character: c.id,
        placeholder: true,
      });
    }
  }

  return [...real, ...placeholders];
})();

export const filterByCharacter = (characterId) =>
  characterId === 'all'
    ? gallery
    : gallery.filter((g) => g.character === characterId);