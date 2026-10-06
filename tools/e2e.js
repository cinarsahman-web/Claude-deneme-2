#!/usr/bin/env node
// End-to-end check: plays each level inside the real game (index.html in Chromium),
// feeding the solver's inputs step by step, and expects the "level complete" screen.
// Usage: node tools/e2e.js [id ...] [--shots]   (screenshots go to tools/out/e2e-NN-*.png)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));

const args = process.argv.slice(2);
const shots = args.includes('--shots');
let ids = args.filter(a => !a.startsWith('--')).map(Number);
const KK = require(path.join(ROOT, 'js/physics.js'));
globalThis.KK = KK;
for (const f of fs.readdirSync(path.join(ROOT, 'js/levels')).filter(f => /^level\d+\.js$/.test(f)).sort()) {
  new Function('KK', fs.readFileSync(path.join(ROOT, 'js/levels', f), 'utf8'))(KK);
}
if (!ids.length) ids = KK.levels.map(d => d.id);

(async () => {
  const browser = await pw.chromium.launch();
  let failed = 0;
  for (const id of ids) {
    const nn = String(id).padStart(2, '0');
    const json = path.join(ROOT, `tools/out/level${nn}.path.json`);
    try { execFileSync('node', [path.join(__dirname, 'solve.js'), String(id), '--no-coins', '--json=' + json], { stdio: 'pipe' }); }
    catch (e) { console.log(`✗ level ${id}: solver failed, skipping`); failed++; continue; }
    const { actions, K } = JSON.parse(fs.readFileSync(json, 'utf8'));
    const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    await page.waitForTimeout(300);
    const idx = await page.evaluate(id => __kk.defs.findIndex(d => d.id === id), id);
    await page.evaluate(([idx, actions, K]) => { __kk.autoplay(actions, K); __kk.startLevel(idx, false); }, [idx, actions, K]);
    const def = KK.levels.find(d => d.id === id);
    const t0 = Date.now(), limit = (def.length / 8 + 15) * 1000;
    let state = '', n = 0;
    while (Date.now() - t0 < limit) {
      await page.waitForTimeout(shots ? 2500 : 1000);
      state = await page.evaluate(() => __kk.state);
      if (shots && state === 'play') await page.screenshot({ path: path.join(ROOT, `tools/out/e2e-${nn}-${String(n++).padStart(2, '0')}.png`) });
      if (state === 'complete' || state === 'dead') break;
    }
    const info = await page.evaluate(() => ({ x: __kk.game.p.x, attempt: __kk.game.attempt }));
    if (state === 'complete' && !errs.length) console.log(`✓ level ${id} completed in the real game`);
    else { failed++; console.log(`✗ level ${id}: state=${state} at x=${info.x.toFixed(1)} attempt=${info.attempt} errors=${JSON.stringify(errs)}`); }
    await page.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
