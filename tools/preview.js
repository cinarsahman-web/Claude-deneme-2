#!/usr/bin/env node
// Renders a whole level as a PNG strip with the solver's path drawn on top.
// Usage: node tools/preview.js <id> [--k=N]   →   tools/out/levelNN.png
// Rows of 100 blocks; the line is the found path (thick = holding), coloured by mode.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const id = process.argv[2];
if (!id) { console.error('usage: node tools/preview.js <id> [--k=N]'); process.exit(1); }
const nn = String(Number(id)).padStart(2, '0');
const out = path.join(ROOT, 'tools/out');
fs.mkdirSync(out, { recursive: true });
const pathFile = path.join(out, `level${nn}.path.json`);
const extra = process.argv.slice(3);
try {
  execFileSync('node', [path.join(__dirname, 'solve.js'), id, '--no-coins', '--json=' + pathFile, ...extra], { stdio: 'inherit' });
} catch (e) { /* solver failed; draw whatever path exists (maybe none) */ }
let route = null;
try { route = JSON.parse(fs.readFileSync(pathFile, 'utf8')); } catch (e) {}

const KK = require(path.join(ROOT, 'js/physics.js'));
globalThis.KK = KK;
const file = path.join(ROOT, 'js/levels', `level${nn}.js`);
new Function('KK', fs.readFileSync(file, 'utf8'))(KK);
const def = KK.levels.find(d => d.id === Number(id));
const L = KK.buildLevel(def);
const data = JSON.stringify({
  end: L.end, name: def.name, blocks: L.blocks, spikes: L.spikes, saws: L.saws, pads: L.pads, orbs: L.orbs,
  portals: L.portals.map(p => Object.assign({}, p, { ceil: isFinite(p.ceil) ? p.ceil : null })), coins: L.coins, colors: L.colors,
  start: L.start, route: route && route.pts,
});

const pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
(async () => {
  const S = 14, ROW = 100, H = 17, PAD = 26;
  const rows = Math.ceil(L.end / ROW);
  const W = ROW * S + 60, HH = rows * (H * S + PAD) + 30;
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: HH } });
  await page.setContent(`<canvas id="c" width="${W}" height="${HH}"></canvas><style>body{margin:0;background:#111}</style>`);
  await page.evaluate(([d, S, ROW, H, PAD, W, HH]) => {
    const L = JSON.parse(d);
    const c = document.getElementById('c').getContext('2d');
    c.fillStyle = '#101426'; c.fillRect(0, 0, W, HH);
    c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif';
    c.fillText(`${L.name} — length ${L.end}. Line = solver path (thick = holding). Colors: cube yellow, ship pink, ball orange, ufo purple, wave cyan, robot green, spider red.`, 10, 18);
    const modeColor = { cube: '#ffd23f', ship: '#ff3d9a', ball: '#ff8a3d', ufo: '#b46bff', wave: '#56f0ff', robot: '#5dff9d', spider: '#ff4040' };
    const rows = Math.ceil(L.end / ROW);
    for (let r = 0; r < rows; r++) {
      const ox = 40 - r * ROW * S, base = 30 + r * (H * S + PAD) + H * S;
      c.save();
      c.beginPath(); c.rect(40, base - H * S, ROW * S, H * S + 4); c.clip();
      const X = x => ox + x * S, Y = y => base - y * S;
      c.fillStyle = '#1b2244'; c.fillRect(40, base - H * S, ROW * S, H * S);
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1;
      for (let gx = r * ROW; gx <= (r + 1) * ROW; gx += 1) { c.beginPath(); c.moveTo(X(gx), base); c.lineTo(X(gx), base - H * S); c.stroke(); }
      for (let gy = 0; gy <= H; gy++) { c.beginPath(); c.moveTo(40, Y(gy)); c.lineTo(40 + ROW * S, Y(gy)); c.stroke(); }
      // ceilings from mode portals
      let ceil = L.start.ceil;
      const segs = [];
      let lastX = 0, curCeil = (L.start.mode === 'ship' || L.start.mode === 'ufo' || L.start.mode === 'wave') ? (ceil ?? 9) : (ceil ?? null);
      for (const p of L.portals) if (p.kind === 'mode') { segs.push([lastX, p.x, curCeil]); lastX = p.x; curCeil = p.ceil; }
      segs.push([lastX, L.end, curCeil]);
      c.fillStyle = 'rgba(255,255,255,.18)';
      for (const [a, b2, cc] of segs) if (cc != null) c.fillRect(X(a), Y(H), (b2 - a) * S, Y(cc) - Y(H));
      c.fillStyle = '#e8ecff'; for (const b of L.blocks) c.fillRect(X(b.x), Y(b.y + b.h), b.w * S, b.h * S);
      c.strokeStyle = '#000'; for (const b of L.blocks) c.strokeRect(X(b.x) + .5, Y(b.y + b.h) + .5, b.w * S - 1, b.h * S - 1);
      c.fillStyle = '#ff4d4d';
      for (const s of L.spikes) {
        c.beginPath();
        if (s.dir > 0) { c.moveTo(X(s.x), Y(s.y)); c.lineTo(X(s.x + .5), Y(s.y + s.h)); c.lineTo(X(s.x + 1), Y(s.y)); }
        else { c.moveTo(X(s.x), Y(s.y + 1)); c.lineTo(X(s.x + .5), Y(s.y + 1 - s.h)); c.lineTo(X(s.x + 1), Y(s.y + 1)); }
        c.fill();
      }
      c.strokeStyle = '#ff4d4d'; c.lineWidth = 2;
      for (const s of L.saws) { c.beginPath(); c.arc(X(s.x), Y(s.y), s.r * S, 0, 7); c.stroke(); }
      const tcol = { yellow: '#ffd23f', pink: '#ff7cc0', blue: '#56c8ff', green: '#5dff9d', black: '#222' };
      for (const d of L.pads) { c.fillStyle = tcol[d.type]; c.fillRect(X(d.x + .1), d.down ? Y(d.y + 1) : Y(d.y + .3), .8 * S, .3 * S); }
      for (const o of L.orbs) { c.fillStyle = tcol[o.type]; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(X(o.x + .5), Y(o.y + .5), .4 * S, 0, 7); c.fill(); c.stroke(); }
      for (const co of L.coins) { c.fillStyle = '#f5c542'; c.beginPath(); c.arc(X(co.x + .5), Y(co.y + .5), .45 * S, 0, 7); c.fill(); c.fillStyle = '#000'; c.font = 'bold 9px sans-serif'; c.fillText(co.idx + 1, X(co.x + .5) - 3, Y(co.y + .5) + 3); }
      c.font = 'bold 10px sans-serif';
      for (const p of L.portals) {
        const col = p.kind === 'mode' ? modeColor[p.value] : p.kind === 'gravity' ? (p.value < 0 ? '#ffd23f' : '#56c8ff') : p.kind === 'speed' ? '#5dff9d' : '#ff7cc0';
        c.fillStyle = col; c.globalAlpha = .35; c.fillRect(X(p.x + .3), Y(H), .4 * S, H * S); c.globalAlpha = 1;
        c.fillStyle = col;
        const label = p.kind === 'mode' ? p.value : p.kind === 'gravity' ? (p.value < 0 ? 'grav↑' : 'grav↓') : p.kind === 'speed' ? 'spd ' + p.value : p.value;
        c.fillText(label, X(p.x) + 2, Y(H) + 11 + (p.kind !== 'mode' ? 11 : 0));
      }
      if (L.route) {
        for (let i = 1; i < L.route.length; i++) {
          const a = L.route[i - 1], b2 = L.route[i];
          if (b2[0] < r * ROW - 2 || a[0] > (r + 1) * ROW + 2) continue;
          c.strokeStyle = modeColor[b2[2]]; c.lineWidth = b2[3] ? 3 : 1.2;
          c.beginPath(); c.moveTo(X(a[0] + a[4] / 2), Y(a[1] + a[4] / 2)); c.lineTo(X(b2[0] + b2[4] / 2), Y(b2[1] + b2[4] / 2)); c.stroke();
        }
      }
      c.restore();
      c.fillStyle = '#9aa6e8'; c.font = '11px sans-serif';
      for (let gx = r * ROW; gx <= Math.min((r + 1) * ROW, L.end + 10); gx += 10) c.fillText(String(gx), ox + gx * S - 6, base + 14);
      c.fillText('y0', 14, base); c.fillText('y10', 10, base - 10 * S + 4);
      c.fillStyle = '#fff'; c.fillRect(ox + L.end * S, base - H * S, 2, H * S);
    }
  }, [data, S, ROW, H, PAD, W, HH]);
  const png = path.join(out, `level${nn}.png`);
  await page.locator('#c').screenshot({ path: png });
  await browser.close();
  console.log('preview written to ' + path.relative(ROOT, png));
})();
