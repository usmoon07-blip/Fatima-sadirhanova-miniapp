/* Bitta buyruq bilan hammasini ishga tushiradi:
   1) kerak bo'lsa paketlarni o'rnatadi
   2) bazani tayyorlaydi (migratsiya + seed)
   3) ngrok'ni ishga tushirib, uning https manzilini .env dagi WEBAPP_URL ga yozadi
   4) API + Bot, Mini App va Admin Panel'ni ishga tushiradi */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

const log = (msg) => console.log(`\n🧁 ${msg}`);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: isWin, ...opts });
  if (r.status !== 0) {
    console.error(`\n❌ Xatolik: ${cmd} ${args.join(' ')}`);
    process.exit(1);
  }
}

function ensureEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error("❌ .env fayli topilmadi. Uni loyiha papkasiga qo'ying.");
    process.exit(1);
  }
}

function readEnvValue(key) {
  const m = fs.readFileSync(ENV_PATH, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

function setEnvValue(key, value) {
  let text = fs.readFileSync(ENV_PATH, 'utf8');
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
  fs.writeFileSync(ENV_PATH, text);
}

function installIfNeeded() {
  const parts = [
    ['.', 'node_modules'],
    ['miniapp', 'miniapp/node_modules'],
    ['admin', 'admin/node_modules'],
  ];
  for (const [dir, nm] of parts) {
    if (!fs.existsSync(path.join(ROOT, nm))) {
      log(`Paketlar o'rnatilmoqda (${dir})... Bu bir necha daqiqa olishi mumkin.`);
      run(npm, dir === '.' ? ['install'] : ['--prefix', dir, 'install']);
    }
  }
}

function getNgrokUrl() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const t = JSON.parse(body).tunnels.find((x) => x.public_url.startsWith('https://'));
          resolve(t ? t.public_url : null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function startNgrok() {
  const check = spawnSync(isWin ? 'where' : 'which', ['ngrok'], { shell: isWin });
  if (check.status !== 0) {
    console.warn("\n⚠️  ngrok topilmadi. Mini App Telegram'da ochilmaydi, lekin Admin Panel va brauzer versiyasi ishlaydi.");
    console.warn('   ngrok o\'rnating: https://ngrok.com/download');
    return null;
  }
  let url = await getNgrokUrl();
  if (!url) {
    log('ngrok ishga tushirilmoqda...');
    const token = readEnvValue('NGROK_AUTHTOKEN');
    const args = ['http', '5173', '--log', 'stdout'];
    if (token) args.push('--authtoken', token);
    const child = spawn('ngrok', args, { cwd: ROOT, shell: isWin, stdio: ['ignore', 'pipe', 'pipe'] });
    let errText = '';
    child.stdout.on('data', (d) => { errText += d; });
    child.stderr.on('data', (d) => { errText += d; });
    process.on('exit', () => child.kill());
    for (let i = 0; i < 30 && !url; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      url = await getNgrokUrl();
    }
    if (!url) {
      console.warn('\n⚠️  ngrok manzilini olib bo\'lmadi.');
      if (/authtoken|ERR_NGROK_4018/i.test(errText)) {
        console.warn("   ngrok tokeni noto'g'ri yoki yo'q. .env dagi NGROK_AUTHTOKEN ni tekshiring yoki shu buyruqni bajaring:");
        console.warn('   ngrok config add-authtoken SIZNING_TOKENINGIZ');
        console.warn('   (token: https://dashboard.ngrok.com/get-started/your-authtoken)');
      }
      return null;
    }
  }
  setEnvValue('WEBAPP_URL', url);
  log(`ngrok manzili .env ga yozildi: ${url}`);
  return url;
}

async function main() {
  ensureEnv();
  installIfNeeded();

  log("Baza tayyorlanmoqda (migratsiya + boshlang'ich kurslar)...");
  run(npm, ['run', 'db:migrate']);
  run(npm, ['run', 'db:seed']);

  const url = await startNgrok();

  log('Hammasi ishga tushirilmoqda...');
  console.log('   • Admin Panel:  http://localhost:5174');
  console.log('   • Mini App:     http://localhost:5173');
  if (url) console.log("   • Telegram'da botingizga /start yozing → «🧁 Kurslarni ko'rish»");
  console.log("   To'xtatish uchun: Ctrl + C\n");

  const dev = spawn(npm, ['run', 'dev'], { cwd: ROOT, stdio: 'inherit', shell: isWin });
  dev.on('exit', (code) => process.exit(code || 0));
}

main();
