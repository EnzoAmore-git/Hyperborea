#!/usr/bin/env node
/** Scan tracked working-tree files without printing any matched secret values. */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv.indexOf('--root');
const root = rootArg >= 0 ? resolve(process.argv[rootArg + 1])
  : resolve(fileURLToPath(new URL('..', import.meta.url)));
const files = execFileSync('git', ['ls-files', '--cached', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean);
const binary = new Set(['.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2', '.otf', '.mp4', '.ogg', '.mp3', '.pdf', '.zip']);
const findings = [];
const staged = process.argv.includes('--staged');
const privateKey = /-----BEGIN (?:OPENSSH |RSA |EC |DSA |ENCRYPTED )?PRIVATE KEY-----/;
const accessToken = /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/;

for (const file of files) {
  if (/(^|\/)\.env(?:\..*)?$/.test(file) && !file.endsWith('.example')) {
    findings.push(`${file}: private environment file must not be tracked`);
    continue;
  }
  if (/(^|\/)(?:id_rsa|id_ed25519|id_ecdsa)$/.test(file)) {
    findings.push(`${file}: private SSH key must not be tracked`);
    continue;
  }
  if (binary.has(extname(file).toLowerCase())) continue;
  let text;
  try {
    if (staged) {
      text = execFileSync('git', ['show', ':' + file], {
        cwd: root, encoding: 'utf8', maxBuffer: 4_000_000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } else {
      if (statSync(resolve(root, file)).size > 3_000_000) continue;
      text = readFileSync(resolve(root, file), 'utf8');
    }
  } catch {
    if (staged) findings.push(`${file}: could not inspect staged content`);
    continue;
  }
  if (text.includes('\0')) continue;
  text.split(/\r?\n/).forEach((line, index) => {
    if (privateKey.test(line)) findings.push(`${file}:${index + 1}: private key material`);
    if (accessToken.test(line)) findings.push(`${file}:${index + 1}: GitHub access token`);
    const assignment = line.match(/^\s*(?:export\s+)?(DEPLOY_PASSWORD|DEPLOY_KEY_PASSPHRASE)\s*=\s*(.*?)\s*$/);
    if (assignment) {
      const value = assignment[2].replace(/\s+#.*$/, '').replace(/^(['"])(.*)\1$/, '$2').trim();
      if (value && !/^\$\{[A-Z_][A-Z_0-9]*\}$/.test(value)) {
        findings.push(`${file}:${index + 1}: deployment password/passphrase must be empty in tracked files`);
      }
    }
  });
}

if (findings.length) {
  console.error(`Secret check failed (${findings.length} findings; values redacted):\n${findings.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Secret check passed: ${files.length} tracked paths; no deployment credentials, private keys or GitHub tokens found.`);
}
