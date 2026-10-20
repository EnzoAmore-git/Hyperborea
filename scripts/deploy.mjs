#!/usr/bin/env node
/**
 * Публикация production-сборки на виртуальный хостинг по SFTP или FTP.
 *
 * Запуск:
 *   npm run deploy          — собрать и залить изменения
 *   npm run deploy:dry      — только собрать и показать, что будет залито
 *
 * Настройки берутся из .env.deploy (не коммитится). Шаблон — .env.deploy.example.
 *
 * Заливаются только файлы, изменившиеся с прошлой публикации: на хостинге
 * лежит .deploy-manifest.json с SHA-256 каждого файла. Старые хешированные
 * ассеты, которых больше нет в сборке, удаляются по манифесту — файлы
 * хостинга, не относящиеся к сайту, не трогаются.
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { copyFile, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ENV_FILE = join(ROOT, '.env.deploy');
const MANIFEST_NAME = '.deploy-manifest.json';
const dryRun = process.argv.includes('--dry-run');

/* ------------------------------------------------------------------ */
/* Конфигурация                                                        */
/* ------------------------------------------------------------------ */

const loadEnvFile = (path) => {
  if (!existsSync(path)) return {};
  const result = {};
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      const comment = value.indexOf(' #');
      if (comment !== -1) value = value.slice(0, comment).trim();
    }
    result[match[1]] = value;
  }
  return result;
};

const env = { ...loadEnvFile(ENV_FILE), ...process.env };

const protocol = (env.DEPLOY_PROTOCOL || 'sftp').trim().toLowerCase();
const host = (env.DEPLOY_HOST || '').trim();
const user = (env.DEPLOY_USER || '').trim();
const password = env.DEPLOY_PASSWORD || '';
const keyPath = (env.DEPLOY_KEY_PATH || '').trim();
const keyPassphrase = env.DEPLOY_KEY_PASSPHRASE || undefined;
const port = Number(env.DEPLOY_PORT || (protocol === 'ftp' ? 21 : 22));
const ftpSecure = /^(1|true|yes)$/i.test(env.DEPLOY_FTP_SECURE || '');
const remoteDirRaw = (env.DEPLOY_REMOTE_DIR || '').trim();

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

const validate = () => {
  if (!['sftp', 'ftp'].includes(protocol)) {
    fail('DEPLOY_PROTOCOL должен быть "sftp" или "ftp".');
  }
  if (!host) fail('Не задан DEPLOY_HOST в .env.deploy.');
  if (!user) fail('Не задан DEPLOY_USER в .env.deploy.');
  if (!remoteDirRaw) fail('Не задан DEPLOY_REMOTE_DIR в .env.deploy.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail('DEPLOY_PORT должен быть числом от 1 до 65535.');
  }
  if (protocol === 'ftp' && !password) {
    fail('Для FTP нужен DEPLOY_PASSWORD.');
  }
  if (protocol === 'sftp' && !password && !keyPath) {
    fail('Для SFTP нужен DEPLOY_PASSWORD или DEPLOY_KEY_PATH.');
  }
  if (keyPath && !existsSync(keyPath)) {
    fail(`Не найден SSH-ключ: ${keyPath}`);
  }
};

let remoteRoot;
if (remoteDirRaw.startsWith('/')) {
  remoteRoot = ('/' + remoteDirRaw.replace(/^\/+|\/+$/g, '')).replace(/\/+$/, '');
} else {
  remoteRoot = remoteDirRaw.replace(/\/+$/g, '');
}
if ((remoteRoot === '' || remoteRoot === '/') && !dryRun) {
  fail('DEPLOY_REMOTE_DIR не должен быть корнем сервера "/". Укажи каталог сайта.');
}
const remotePath = (rel) => (remoteRoot === '' ? rel : `${remoteRoot.replace(/\/+$/, '')}/${rel}`);
const remoteManifest = `${remoteRoot}/${MANIFEST_NAME}`;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ------------------------------------------------------------------ */
/* Сборка                                                              */
/* ------------------------------------------------------------------ */

console.log('\n▸ Production-сборка (base = /)…');
const buildEnv = { ...process.env };
// Для корня домена базовый путь должен быть '/', а не '/Hyperborea'.
delete buildEnv.VITE_BASE_PATH;

const build = spawnSync('npm run build', {
  cwd: ROOT,
  env: buildEnv,
  stdio: 'inherit',
  shell: true,
});
if (build.error) fail(`Не удалось запустить сборку: ${build.error.message}`);
if (build.status !== 0) fail('Сборка завершилась с ошибкой.');

const indexPath = join(DIST, 'index.html');
if (!existsSync(indexPath)) fail('В dist/ нет index.html — сборка неполная.');

const htaccessPath = join(ROOT, 'deploy', '.htaccess');
if (existsSync(htaccessPath)) {
  await copyFile(htaccessPath, join(DIST, '.htaccess'));
  console.log('▸ deploy/.htaccess добавлен в dist (SPA-фолбэк для Apache).');
} else {
  console.warn('! deploy/.htaccess не найден — прямые ссылки могут давать 404.');
}

/* ------------------------------------------------------------------ */
/* Список файлов и хеши                                                */
/* ------------------------------------------------------------------ */

const IGNORED = new Set([MANIFEST_NAME, '.DS_Store', 'Thumbs.db', 'desktop.ini']);

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walk(abs)));
    } else if (entry.isFile()) {
      result.push({ abs, rel: relative(DIST, abs).split(sep).join('/') });
    }
  }
  return result;
};

const hashFile = (file) =>
  new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolveHash(hash.digest('hex')));
  });

const files = await walk(DIST);
if (files.length === 0) fail('dist/ пуст — нечего публиковать.');

for (const file of files) {
  file.hash = await hashFile(file.abs);
  file.size = (await stat(file.abs)).size;
}

// Сначала ассеты, потом .htaccess и index.html: если заливка оборвётся,
// посетители останутся на старой рабочей версии.
const order = (rel) => (rel === 'index.html' ? 2 : rel === '.htaccess' ? 1 : 0);
files.sort((a, b) => order(a.rel) - order(b.rel) || a.rel.localeCompare(b.rel));

const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

if (dryRun) {
  console.log(`\n▸ Проверка без заливки: ${files.length} файлов, ${formatBytes(totalBytes)}.`);
  console.log('  Первые файлы:');
  for (const file of files.slice(0, 8)) {
    console.log(`    ${file.rel} (${formatBytes(file.size)})`);
  }
  console.log('\n✓ Dry-run завершён. Соединение с хостингом не открывалось.\n');
  process.exit(0);
}

validate();

console.log(`\n▸ Хостинг: ${protocol}://${user}@${host}:${port}${remoteRoot}`);

/* ------------------------------------------------------------------ */
/* SFTP / FTP                                                          */
/* ------------------------------------------------------------------ */

const createAdapter = async () => {
  if (protocol === 'sftp') {
    const { default: SftpClient } = await import('ssh2-sftp-client');
    const client = new SftpClient();
    const ensured = new Set();
    let useCwd = false;

    const ensure = async (dir) => {
      if (!dir || dir === '.' || dir === '/' || ensured.has(dir)) return;
      const parts = dir.split('/').filter(Boolean);
      let current = '';
      for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        if (ensured.has(current)) continue;
        try {
          await client.stat(current);
        } catch {
          try {
            await client.mkdir(current);
          } catch {
            // Игнорируем, каталог может уже существовать
          }
        }
        ensured.add(current);
      }
      ensured.add(dir);
    };

    await client.connect({
      host,
      port,
      username: user,
      ...(keyPath
        ? { privateKey: readFileSync(keyPath), passphrase: keyPassphrase }
        : { password }),
    });

    try {
      await client.cwd(remoteRoot);
      useCwd = true;
      console.log('▸ Перешёл в document root (cwd).');
    } catch (err) {
      console.log('▸ cwd не удался, буду использовать абсолютные пути.');
      useCwd = false;
      await ensure(remoteRoot);
    }

    const manifestNameRel = MANIFEST_NAME;

    return {
      async readManifest() {
        try {
          const data = useCwd
            ? await client.get(manifestNameRel)
            : await client.get(remoteManifest);
          const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
          return JSON.parse(text);
        } catch {
          return null;
        }
      },
      async upload(rel, buffer) {
        if (useCwd) {
          const targetDir = dirname(rel);
          if (targetDir && targetDir !== '.') {
            await ensure(targetDir);
          }
          await client.put(buffer, rel);
        } else {
          const target = remotePath(rel);
          await ensure(dirname(target));
          await client.put(buffer, target);
        }
      },
      async remove(rel) {
        try {
          if (useCwd) {
            await client.delete(rel);
          } else {
            await client.delete(remotePath(rel));
          }
        } catch {
          // Файла уже нет.
        }
      },
      async writeManifest(buffer) {
        if (useCwd) {
          await client.put(buffer, manifestNameRel);
        } else {
          await client.put(buffer, remoteManifest);
        }
      },
      async close() {
        await client.end().catch(() => {});
      },
    };
  }

  const { Client } = await import('basic-ftp');
  const client = new Client(30000);
  const ensured = new Set();

  const ensure = async (dir) => {
    if (ensured.has(dir)) return;
    await client.ensureDir(dir);
    ensured.add(dir);
  };

  await client.access({ host, port, user, password, secure: ftpSecure });
  await ensure(remoteRoot);

  return {
    async readManifest() {
      const chunks = [];
      const sink = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });
      try {
        await client.downloadTo(sink, remoteManifest);
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return null;
      }
    },
    async upload(rel, buffer) {
      const target = remotePath(rel);
      await ensure(dirname(target));
      await client.uploadFrom(Readable.from(buffer), target);
    },
    async remove(rel) {
      try {
        await client.remove(remotePath(rel));
      } catch {
        // Файла уже нет.
      }
    },
    async writeManifest(buffer) {
      await client.uploadFrom(Readable.from(buffer), remoteManifest);
    },
    async close() {
      client.close();
    },
  };
};

let adapter = null;
try {
  adapter = await createAdapter();

  const previous = await adapter.readManifest();
  const previousFiles =
    previous && previous.files && typeof previous.files === 'object' ? previous.files : {};
  const localRels = new Set(files.map((file) => file.rel));

  const toUpload = files.filter((file) => previousFiles[file.rel] !== file.hash);
  const toDelete = Object.keys(previousFiles).filter((rel) => !localRels.has(rel));

  if (toUpload.length === 0 && toDelete.length === 0) {
    console.log('\n✓ Изменений нет — хостинг уже содержит актуальную версию.');
  } else {
    console.log(
      `\n▸ Заливка: ${toUpload.length} новых/изменённых, ${toDelete.length} к удалению.`,
    );

    let uploadedBytes = 0;
    for (let i = 0; i < toUpload.length; i += 1) {
      const file = toUpload[i];
      const buffer = await readFile(file.abs);
      await adapter.upload(file.rel, buffer);
      uploadedBytes += buffer.length;
      console.log(`  ↑ [${i + 1}/${toUpload.length}] ${file.rel} (${formatBytes(buffer.length)})`);
    }

    for (const rel of toDelete) {
      await adapter.remove(rel);
      console.log(`  − ${rel}`);
    }

    const manifest = {
      version: 1,
      generatedAt: new Date().toISOString(),
      files: Object.fromEntries(files.map((file) => [file.rel, file.hash])),
    };
    await adapter.writeManifest(Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

    console.log(
      `\n✓ Готово: загружено ${toUpload.length} файлов (${formatBytes(uploadedBytes)}), ` +
        `пропущено ${files.length - toUpload.length}, удалено ${toDelete.length}.`,
    );
  }
} catch (error) {
  console.error(`\n✖ Не удалось опубликовать: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (adapter) await adapter.close();
}
