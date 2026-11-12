const SUBSETS = {
  'cyrillic-ext':
    'U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F',
  cyrillic: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  latin:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
};

const FONT_FACES = [
  ['Cormorant Garamond', '400', 'CormorantGaramond', 'CormorantGaramond-400'],
  ['Cormorant Garamond', '700', 'CormorantGaramond', 'CormorantGaramond-700'],
  ['Inter', '400', 'Inter', 'Inter-400'],
  ['Inter', '500', 'Inter', 'Inter-500'],
  ['Inter', '600', 'Inter', 'Inter-600'],
  ['JetBrains Mono', '400', 'JetBrainsMono', 'JetBrainsMono-400'],
];

const toStyle = (base) => {
  const trimmed = base.endsWith('/') ? base : base + '/';
  const url = (p) => `url('${trimmed}${p.replace(/^\/+/, '')}') format('woff2')`;
  const faces = FONT_FACES.flatMap(([family, weight, dir, file]) =>
    Object.entries(SUBSETS).map(
      ([subset, range]) =>
        `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
        `font-display:${family === 'JetBrains Mono' ? 'fallback' : 'swap'};` +
        `src:${url(`/fonts/${dir}/${file}-${subset}.woff2`)};` +
        `unicode-range:${range};}`
    )
  );
  return faces.join('');
};

const injectFonts = () => {
  if (typeof document === 'undefined' || document.getElementById('hyperborea-fonts')) return;
  const style = document.createElement('style');
  style.id = 'hyperborea-fonts';
  style.setAttribute('data-fonts', 'runtime');
  style.textContent = toStyle(import.meta.env.BASE_URL);
  document.head.appendChild(style);
};

export { injectFonts };