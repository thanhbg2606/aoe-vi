/**
 * Build: src/main.js + lang/vi/*.json  ->  dist/aoe-vi.min.js
 *
 *   npm install       (lần đầu, cài esbuild)
 *   npm run build
 *
 * - Nhúng toàn bộ bản dịch vào một file, chỉ 1 lượt tải.
 * - Thay câu tiếng Anh bằng hash ngắn (vẫn kiểm tra được khi game đổi câu gốc).
 * - Minify code.
 */
import { build } from 'esbuild';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { hashText } from '../src/hash.js';

const LANG_DIR = new URL('../lang/vi/', import.meta.url);
const OUT = 'dist/aoe-vi.min.js';

const formatSpecs = (s) => (s.match(/%%|%[0-9.]*[sdcuxif]/g) || []).join(',');

async function loadLang() {
  const index = JSON.parse(await readFile(new URL('index.json', LANG_DIR), 'utf8'));
  const data = {};
  const problems = [];
  for (const file of index.files) {
    const entries = JSON.parse(await readFile(new URL(file, LANG_DIR), 'utf8'));
    for (const [id, pair] of Object.entries(entries)) {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || typeof pair[1] !== 'string') {
        problems.push(`${file} ID ${id}: phải có dạng ["English", "Tiếng Việt"]`);
        continue;
      }
      const [en, vi] = pair;
      if (formatSpecs(en) !== formatSpecs(vi)) problems.push(`${file} ID ${id}: lệch %s/%d: "${vi}"`);
      if (id in data) problems.push(`${file} ID ${id}: trùng với file khác`);
      data[id] = [hashText(en), vi];
    }
  }
  return { data, problems, files: index.files.length };
}

const { data, problems, files } = await loadLang();
if (problems.length) {
  console.error('Lỗi trong bản dịch:\n  ' + problems.join('\n  '));
  process.exit(1);
}

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/main.js'],
  outfile: OUT,
  bundle: true,
  format: 'esm',
  minify: true,
  charset: 'utf8',
  legalComments: 'none',
  target: ['es2020'],
  define: { __AOE_VI_DATA__: JSON.stringify(data) },
  banner: { js: '// aoe-vi – Việt hóa Age of Empires trên vivalarts.com. Bản build, đừng sửa trực tiếp: sửa src/ và lang/ rồi chạy npm run build.' },
});

const { size } = await stat(OUT);
console.log(`OK: ${Object.keys(data).length} câu từ ${files} file -> ${OUT} (${(size / 1024).toFixed(1)} KB)`);
