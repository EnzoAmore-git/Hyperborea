/**
 * Оптимизация изображений (Этап 6.2 / 6.6).
 * - Арты: WebP 400/800/1200px (q82) + LQIP 40px
 * - Страницы комикса: WebP 800/1200/1600px (q75) + LQIP 40px
 * - Иконки PWA 192/512 from favicon.svg
 * Выход: public/images/art/webp/, public/pages/<chapter>/webp/, public/pwa/.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));

const ART_DIR = join(root, 'public/images/art');
const ART_OUT = join(ART_DIR, 'webp');
const PAGES_DIR = join(root, 'public/pages');
const TEAM_DIR = join(root, 'sources/Team');
const TEAM_OUT = join(root, 'public/images/team');
const ART_WIDTHS = [400, 800, 1200];
const PAGE_WIDTHS = [800, 1200, 1600];
const TEAM_WIDTHS = [176, 352];
const ART_QUALITY = 82;
const PAGE_QUALITY = 75;
const TEAM_QUALITY = 82;
const LQIP = 40;
const ART_LIMIT = 500 * 1024;
const PAGE_LIMIT = 800 * 1024;

/** Транслитерация кириллических имён файлов в ASCII-slug. */
const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function slugify(name) {
  return name
    .toLowerCase()
    .split('')
    .map((ch) => (TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listImages(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    if (/\.(jpe?g|png)$/i.test(name)) out.push(join(dir, name));
  }
  return out;
}

async function derivative(inPath, outPath, width, quality) {
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(inPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outPath);
  return (await stat(outPath)).size;
}

async function lqip(inPath, outPath) {
  await sharp(inPath)
    .rotate()
    .resize({ width: LQIP, withoutEnlargement: true })
    .webp({ quality: 40, blur: 0.6 })
    .toFile(outPath);
  return (await stat(outPath)).size;
}

const report = [];
let tooBig = 0;

async function processGroup(files, outDir, widths, quality, limit, kind) {
  for (const file of files) {
    const stem = basename(file, extname(file));
    for (const w of widths) {
      const p = join(outDir, `${stem}-${w}.webp`);
      const bytes = await derivative(file, p, w, quality);
      report.push(`${kind} ${stem}-${w}.webp  ${(bytes / 1024).toFixed(1)} KB`);
      if (bytes > limit) {
        tooBig += 1;
        report.push(`  ⚠ ПРЕВЫШЕНИЕ ${kind} ${stem} (${(bytes / 1024).toFixed(1)} KB)`);
      }
    }
    const lq = join(outDir, `${stem}-${LQIP}.webp`);
    const lb = await lqip(file, lq);
    report.push(`${kind} ${stem}-${LQIP}.webp (LQIP) ${(lb / 1024).toFixed(1)} KB`);
  }
}

async function run() {
  const arts = await listImages(ART_DIR);
  console.log(`Арты: ${arts.length} шт.`);
  await processGroup(arts, ART_OUT, ART_WIDTHS, ART_QUALITY, ART_LIMIT, 'art');

  // Фото команды: sources/Team/<Имя>_<Должность>.(png|jpg) → public/images/team/
  let teamFiles = [];
  try {
    teamFiles = await listImages(TEAM_DIR);
  } catch {
    teamFiles = [];
  }
  console.log(`Команда: ${teamFiles.length} фото`);
  for (const file of teamFiles) {
    const slug = slugify(basename(file, extname(file)));
    for (const w of TEAM_WIDTHS) {
      const p = join(TEAM_OUT, `${slug}-${w}.webp`);
      const bytes = await derivative(file, p, w, TEAM_QUALITY);
      report.push(`team ${slug}-${w}.webp  ${(bytes / 1024).toFixed(1)} KB`);
    }
  }

  const chapters = (await readdir(PAGES_DIR)).filter((n) => n.startsWith('chapter-'));
  for (const ch of chapters) {
    const chDir = join(PAGES_DIR, ch);
    const files = await listImages(chDir);
    const outDir = join(chDir, 'webp');
    console.log(`${ch}: ${files.length} стр.`);
    await processGroup(files, outDir, PAGE_WIDTHS, PAGE_QUALITY, PAGE_LIMIT, 'page');
  }

  // Иконки PWA из favicon.svg (6.6)
  const svg = join(root, 'public/favicon.svg');
  const pwaDir = join(root, 'public/pwa');
  await mkdir(pwaDir, { recursive: true });
  for (const [name, size] of Object.entries({ 'icon-192.png': 192, 'icon-512.png': 512 })) {
    await sharp(svg).resize({ width: size, height: size }).png().toFile(join(pwaDir, name));
  }
  // maskable: иконка 384px в безопасной зоне на холсте 512px с фоном бренда
  const fg = await sharp(svg).resize({ width: 384, height: 384 }).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 11, g: 10, b: 16, alpha: 1 } },
  })
    .composite([{ input: fg, gravity: 'center' }])
    .png()
    .toFile(join(pwaDir, 'icon-maskable-512.png'));
  report.push('pwa icon-192/512/maskable-512 → public/pwa/');

  console.log('\n--- производные ---');
  console.log(report.join('\n'));
  if (tooBig) {
    console.error(`\nFAIL: ${tooBig} файл(ов) превышают лимит по размеру.`);
    process.exit(1);
  }
  console.log(`\nOK: лимиты соблюдены (art ≤ 500KB, page ≤ 800KB).`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});