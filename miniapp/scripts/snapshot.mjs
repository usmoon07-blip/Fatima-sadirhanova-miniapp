/* Qurilishdan oldin (prebuild) kurslar nusxasini serverdan olib, src/snapshot.json ga yozadi.
   Mini App ochilishi bilan kurslar shu nusxadan ko'rinadi — server uxlab yotgan bo'lsa ham.
   Server javob bermasa qurilish to'xtamaydi: omborda saqlangan eski nusxa ishlatiladi. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, '..', 'src', 'snapshot.json');

function readEnvFile(file) {
  try {
    const m = fs.readFileSync(path.join(dir, '..', file), 'utf8').match(/^VITE_API_URL=(.*)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
}

const api = (process.env.VITE_API_URL || readEnvFile('.env.production.local') || readEnvFile('.env.production')).replace(/\/+$/, '');

async function get(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  if (!/^https?:\/\//.test(api)) {
    console.log('ℹ️  VITE_API_URL yo\'q — mavjud snapshot.json ishlatiladi.');
    return;
  }
  // Bepul server uxlab yotgan bo'lsa uyg'onishiga 60 soniyagacha vaqt beramiz
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const [catalog, config] = await Promise.all([get(`${api}/catalog`, 70000), get(`${api}/config`, 70000)]);
      if (!Array.isArray(catalog.courses) || !catalog.courses.length) throw new Error("kurslar bo'sh");
      fs.writeFileSync(out, `${JSON.stringify({ catalog, config, createdAt: new Date().toISOString() }, null, 2)}\n`);
      console.log(`✅ Snapshot yangilandi: ${catalog.courses.length} ta kurs`);
      return;
    } catch (err) {
      console.log(`⚠️  Snapshot (${attempt}/3): ${err.message}`);
    }
  }
  console.log('ℹ️  Server javob bermadi — omborda saqlangan snapshot.json ishlatiladi.');
}

main();
