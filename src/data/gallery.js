/**
 * Данные галереи концептов.
 * ⚠️ ЗАГЛУШКИ: персонажи и подписи проставлены временно (нет данных из артов).
 * Замените `label`/`character`/`caption` под реальных персонажей —
 * фильтрация и карточки работают от этих полей.
 */

// Пути с префиксом базового пути (локально '/', на GH Pages '/Hyperborea/')
const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export const characters = [
  { id: 'char-a', label: 'Персонаж 1' },
  { id: 'char-b', label: 'Персонаж 2' },
  { id: 'char-c', label: 'Персонаж 3' },
  { id: 'char-d', label: 'Персонаж 4' },
  { id: 'landscape', label: 'Пейзаж' },
];

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

export const gallery = RAW_GALLERY.map((g) => ({
  ...g,
  src: asset(g.src),
}));

/** Имя персонажа по id (для подписи карточки) */
export const characterLabel = (id) =>
  characters.find((c) => c.id === id)?.label ?? id;

export const filterByCharacter = (characterId) =>
  characterId === 'all'
    ? gallery
    : gallery.filter((g) => g.character === characterId);