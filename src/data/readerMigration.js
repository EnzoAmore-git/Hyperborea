/** v2 removes the temporary illustrations from chapters 4 and 5. */
export const READING_POSITION_VERSION = '3';
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

// v2 pages mapped to the closest matching passage in the revised demo.
const DEMO_PAGE_MAP = [
  [1,2,4,4,6,6,10,16,16,27,27,34,34,36,36,40,40,40,40,42,42,45,45,47,47],
  [1,3,5,5,7,7,7,9,9,11,11,11,11,11,14,14,14,14,14,14,15,15,15,16,16,16,18,18,18,18,20,20,22,22,22,22,22,22,23,23],
  [1,2,2,2,3,3,5,5,7,7,9,9,9,11,11,11,11,13,13,17,17,17,17,19,19,19,19,21,21,21,23,25,25,25,25,26],
  [1,2,2,5,6,8,8],
  [1,2,2,3,5,6,8,9],
];

export const migrateReadingPosition = (saved, version) => {
  if (!saved || version === READING_POSITION_VERSION) return saved;
  const ch = String(saved.ch);
  const page = Number(saved.pg);
  if (!Number.isInteger(page) || page < 1) return null;
  const v2Page = version === '2' ? page : (LEGACY_PAGES[ch]?.[page] ?? page);
  return { ch, pg: DEMO_PAGE_MAP[Number(ch) - 1]?.[v2Page - 1] ?? v2Page };
};
