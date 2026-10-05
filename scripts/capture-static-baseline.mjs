import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'migration/static-baseline.json');
const read = (file) => readFileSync(resolve(root, file), 'utf8');

function expandIncludes(file) {
  return read(file).replace(/<include src="([^"]+)"><\/include>/g, (_, source) =>
    readFileSync(resolve(root, dirname(file), source), 'utf8')
  );
}

const pages = {
  '/': expandIncludes('index.html'),
  '/overview.html': read('overview.html'),
};
const paths = new Set();
for (const html of Object.values(pages)) {
  for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
    if (!/^(?:https?:|data:|#)/.test(match[1])) paths.add(match[1]);
  }
}

const assets = [...paths].sort().map((url) => {
  const relative = decodeURIComponent(url.replace(/^\//, ''));
  const file = resolve(root, relative.startsWith('src/') ? relative : `public/${relative}`);
  return {
    url,
    exists: existsSync(file),
    sha256: existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : null,
  };
});

const baseline = {
  description: 'Static source baseline before the Next.js migration; not a browser-rendered snapshot.',
  viewports: [375, 768, 1440],
  pages,
  stylesheet: read('src/style.css'),
  clientScript: read('src/main.js'),
  assets,
};

if (existsSync(destination) && !process.argv.includes('--update')) {
  throw new Error('Baseline already exists. Use --update only when deliberately replacing the migration reference.');
}
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(baseline, null, 2) + '\n');
console.log(`Captured ${Object.keys(pages).length} pages and ${assets.length} local asset references.`);
const missing = assets.filter((asset) => !asset.exists);
if (missing.length) {
  console.log('Existing missing assets:', missing.map((asset) => asset.url).join(', '));
  process.exitCode = 1;
}
