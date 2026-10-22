// Busca emojis en el código fuente. Uso: node scripts/emoji-scan.mjs [--texts]
// Sin argumentos ignora los archivos de diálogos (story.js, maincra.js); con --texts los incluye.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RE = /[\p{Extended_Pictographic}←-⇿■-◿⏩-⏿⬀-⯿️]/u;
const withTexts = process.argv.includes('--texts');
let total = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|html)$/.test(name) && (withTexts || !/(story|maincra)\.js$/.test(name))) {
      readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
        if (RE.test(line)) {
          total++;
          console.log(`${p.replace(/\\/g, '/')}:${i + 1}: ${line.trim().slice(0, 190)}`);
        }
      });
    }
  }
}
walk('src');
console.log(`\n${total} líneas con emojis`);
