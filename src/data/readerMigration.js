/** v2 removes the temporary illustrations from chapters 4 and 5. */
export const READING_POSITION_VERSION = '2';
const LEGACY_PAGES = {
  "4": {
    "1": 1,
    "2": 2,
    "3": 2,
    "4": 3,
    "5": 3,
    "6": 4,
    "7": 4,
    "8": 5,
    "9": 5,
    "10": 6,
    "11": 6,
    "12": 7,
    "13": 7,
    "14": 7
  },
  "5": {
    "1": 1,
    "2": 2,
    "3": 2,
    "4": 3,
    "5": 3,
    "6": 4,
    "7": 4,
    "8": 5,
    "9": 5,
    "10": 6,
    "11": 6,
    "12": 7,
    "13": 7,
    "14": 8,
    "15": 8,
    "16": 8
  }
};

export const migrateReadingPosition = (saved, version) => {
  if (!saved || version === READING_POSITION_VERSION) return saved;
  const ch = String(saved.ch);
  const page = Number(saved.pg);
  if (!Number.isInteger(page) || page < 1) return null;
  // A removed illustration maps to the next surviving text, or the last one.
  return { ch, pg: LEGACY_PAGES[ch]?.[page] ?? page };
};
