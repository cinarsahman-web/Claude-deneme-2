#!/usr/bin/env node
// Level verifier for Kare Koşusu.
// Runs the game's real physics (js/physics.js) and searches every hold/release timing
// to prove a level can be finished, that each coin can be collected, and that the
// level is not pixel-perfect for its difficulty.
//
// Usage:
//   node tools/solve.js <id|all> [--k=N] [--json=path] [--trace] [--no-coins]
//
// --k=N      only run the completion check with a decision every N physics steps (240 steps = 1s)
// --json     write the solution path (for tools/preview.js)
// --trace    print every hold interval of the solution
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KK = require(path.join(ROOT, 'js/physics.js'));
globalThis.KK = KK;

function loadLevels() {
  const dir = path.join(ROOT, 'js/levels');
  for (const f of fs.readdirSync(dir).filter(f => /^level\d+\.js$/.test(f)).sort()) {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    try { new Function('KK', code)(KK); }
    catch (e) { console.error(`✗ ${f}: ${e.message}`); process.exitCode = 1; }
  }
  return KK.levels;
}

// Coarsest decision interval (in 1/240 s physics steps) at which a level of this
// difficulty must still be beatable. Bigger = more forgiving timing windows.
const REQUIRED_K = { easy: 12, normal: 10, hard: 8, harder: 7, insane: 6, demon: 5 };

const { DT, step, newPlayer, clonePlayer, buildLevel } = KK;

function stateKey(p, t, L) {
  let used = '';
  for (const id of p.used) {
    const o = L._byId.get(id);
    if (o && o.x > p.x - 2) used += id + ',';
  }
  const jb = p.jumpBuf > 0 ? Math.ceil(p.jumpBuf / DT / 4) : 0;
  const bo = p.boost > 0 ? Math.ceil(p.boost / DT / 4) : 0;
  return t + '|' + Math.round(p.y * 50) + '|' + Math.round(p.vy * 5) + '|' + p.mode + p.grav + p.size +
    (p.grounded ? 'g' : 'a') + (p.holdPrev ? 'h' : 'r') + jb + '|' + bo + '|' + used + '|' + p.coins.size;
}

function solve(L, K, opts = {}) {
  const needCoin = opts.coin; // coin object that must be collected, or undefined
  const seen = new Set();
  const maxStates = opts.maxStates || 4e6;
  const stack = [{ p: newPlayer(L), t: 0, i: 0, choices: null }];
  let far = 0;
  while (stack.length) {
    const top = stack[stack.length - 1];
    if (top.choices === null) {
      const key = stateKey(top.p, top.t, L);
      if (seen.has(key)) { stack.pop(); continue; }
      seen.add(key);
      if (seen.size > maxStates) return { ok: false, far, states: seen.size, gaveUp: true };
      top.choices = top.p.holdPrev ? [true, false] : [false, true];
    }
    if (top.i >= 2) { stack.pop(); continue; }
    const hold = top.choices[top.i++];
    const q = clonePlayer(top.p);
    for (let i = 0; i < K; i++) { step(q, L, DT, hold); if (q.dead || q.won) break; }
    if (q.x > far) far = q.x;
    if (q.dead) continue;
    if (needCoin && !q.coins.has(needCoin.idx) && q.x > needCoin.x + 2) continue;
    if (q.won) {
      if (needCoin && !q.coins.has(needCoin.idx)) continue;
      return { ok: true, actions: stack.map(e => e.choices[e.i - 1]), states: seen.size };
    }
    stack.push({ p: q, t: top.t + 1, i: 0, choices: null });
  }
  return { ok: false, far, states: seen.size };
}

function replay(L, K, actions) {
  const p = newPlayer(L);
  const pts = [], states = [];
  const ev = [];
  for (const hold of actions) {
    states.push(clonePlayer(p));
    for (let i = 0; i < K; i++) {
      step(p, L, DT, hold, ev);
      if (i % 2 === 0) pts.push([+p.x.toFixed(3), +p.y.toFixed(3), p.mode, hold ? 1 : 0, p.size, p.grav]);
      if (p.dead || p.won) break;
    }
  }
  return { pts, states, final: p, events: ev };
}

function holdIntervals(L, K, actions) {
  const p = newPlayer(L);
  const out = [];
  let cur = null;
  for (const hold of actions) {
    const x0 = p.x, mode = p.mode;
    for (let i = 0; i < K; i++) { step(p, L, DT, hold); if (p.dead || p.won) break; }
    if (hold && !cur) cur = { from: x0, to: p.x, mode };
    else if (hold) cur.to = p.x;
    else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}

// Pads the player can only survive by doing something odd (the bug from level 1):
// walking onto the pad with no input from the state the solution had 4 blocks earlier must survive.
function padWarnings(L, states) {
  const warns = [];
  for (const d of L.pads) {
    if (d.down) continue;
    const s0 = states.find(s => s.x >= d.x - 4);
    if (!s0 || !(s0.mode === 'cube' || s0.mode === 'robot') || !s0.grounded || s0.grav < 0) continue;
    const q = clonePlayer(s0);
    q.holdPrev = false;
    let hit = false;
    while (!q.dead && !q.won && q.x < d.x + 7) {
      step(q, L, DT, false);
      if (q.used.has(d.id)) hit = true;
    }
    if (hit && q.dead) warns.push(`pad at x=${d.x}: walking onto it without pressing kills the player at x=${q.x.toFixed(1)}, y=${q.y.toFixed(1)}`);
  }
  return warns;
}

function lint(def, L) {
  const errs = [], warns = [];
  for (const k of ['id', 'name', 'difficulty', 'stars', 'length', 'music', 'build']) if (def[k] === undefined) errs.push('missing field ' + k);
  if (def.difficulty && !KK.DIFFICULTIES[def.difficulty]) errs.push('unknown difficulty ' + def.difficulty);
  if (L.coins.length !== 3) errs.push(`needs exactly 3 coins, has ${L.coins.length}`);
  const all = [...L.blocks, ...L.spikes, ...L.saws, ...L.pads, ...L.orbs, ...L.portals, ...L.coins];
  for (const o of all) {
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y === undefined ? 0 : o.y)) errs.push('non-numeric position ' + JSON.stringify(o));
    if (o.x > L.end + 2) warns.push(`object past the end at x=${o.x}`);
  }
  for (const o of [...L.blocks, ...L.spikes]) if (o.y < 0) errs.push(`object below the floor at x=${o.x}, y=${o.y}`);
  const m = def.music || {};
  if (!(m.bpm >= 90 && m.bpm <= 200)) errs.push('music.bpm must be 90..200');
  if (!['minor', 'major', 'dorian', 'phrygian', 'harmonic', 'lydian'].includes(m.scale)) errs.push('music.scale must be one of minor, major, dorian, phrygian, harmonic, lydian');
  if (!Array.isArray(m.prog) || m.prog.length !== 4 || m.prog.some(d => !(d >= 0 && d <= 6))) errs.push('music.prog must be 4 scale degrees 0..6');
  if (!['four', 'break', 'half', 'dnb', 'march'].includes(m.drums)) errs.push('music.drums must be one of four, break, half, dnb, march');
  if (!['arp', 'melody', 'stabs', 'pluck'].includes(m.lead)) errs.push('music.lead must be one of arp, melody, stabs, pluck');
  if (!(m.root >= 36 && m.root <= 52)) errs.push('music.root must be a MIDI note 36..52');
  return { errs, warns };
}

function main() {
  const args = process.argv.slice(2);
  const which = args.find(a => !a.startsWith('--')) || 'all';
  const opt = n => { const a = args.find(x => x.startsWith('--' + n)); return a ? (a.split('=')[1] ?? true) : undefined; };
  const levels = loadLevels();
  const chosen = which === 'all' ? levels : levels.filter(d => String(d.id) === String(Number(which)));
  if (!chosen.length) { console.error('No level ' + which); process.exit(1); }
  let failed = false;
  for (const def of chosen) {
    const t0 = Date.now();
    let L;
    try { L = buildLevel(def); } catch (e) { console.log(`✗ level ${def.id}: build() threw: ${e.message}`); failed = true; continue; }
    L._byId = new Map([...L.pads, ...L.orbs].map(o => [o.id, o]));
    const { errs, warns } = lint(def, L);
    const reqK = opt('k') ? Number(opt('k')) : REQUIRED_K[def.difficulty] || 4;
    const secs = (L.end / 10.4).toFixed(0);
    console.log(`\n=== Level ${def.id}: ${def.name} (${def.difficulty}, ${def.stars}★, length ${L.end} ≈ ${secs}s at normal speed)`);
    for (const e of errs) console.log('  ✗ ' + e);

    let res = solve(L, reqK), K = reqK;
    if (res.ok) {
      console.log(`  ✓ beatable and forgiving enough for "${def.difficulty}": works deciding only every ${reqK} steps (${(240 / reqK).toFixed(0)} Hz timing)`);
    } else {
      const fine = reqK === 4 ? res : solve(L, 4);
      if (!fine.ok) {
        console.log(`  ✗ NOT BEATABLE even with 60 Hz timing. Furthest x reached: ${fine.far.toFixed(1)} (states ${fine.states}${fine.gaveUp ? ', gave up' : ''})`);
        failed = true; continue;
      }
      console.log(`  ✗ TOO TIGHT for "${def.difficulty}": beatable at 60 Hz but not when deciding every ${reqK} steps (${(240 / reqK).toFixed(0)} Hz). Coarse search died furthest at x=${res.far.toFixed(1)}; widen the timing windows around there.`);
      failed = true; res = fine; K = 4;
    }
    const rp = replay(L, K, res.actions);
    const ys = rp.pts.map(p => p[1]);
    console.log(`  path: y range ${Math.min(...ys).toFixed(1)}..${Math.max(...ys).toFixed(1)}, ${rp.events.filter(e => e.type === 'jump').length} jumps/taps, ${rp.events.filter(e => e.type === 'orb').length} orbs, ${rp.events.filter(e => e.type === 'pad').length} pads`);

    if (!opt('no-coins')) {
      for (const c of L.coins) {
        let r = solve(L, 6, { coin: c });
        if (!r.ok) r = solve(L, 4, { coin: c });
        if (r.ok) console.log(`  ✓ coin ${c.idx + 1} at (${c.x}, ${c.y}) can be collected and the level still finished`);
        else { console.log(`  ✗ coin ${c.idx + 1} at (${c.x}, ${c.y}) is UNREACHABLE (or reachable only by dying). Furthest x: ${r.far.toFixed(1)}`); failed = true; }
      }
    }
    for (const w of [...warns, ...padWarnings(L, rp.states)]) console.log('  ! ' + w);
    if (errs.length) failed = true;
    if (opt('trace')) {
      console.log('  hold intervals of the solution (x from → to, mode):');
      for (const h of holdIntervals(L, K, res.actions)) console.log(`    ${h.from.toFixed(1)} → ${h.to.toFixed(1)}  ${h.mode}`);
    }
    if (opt('json')) {
      const out = typeof opt('json') === 'string' ? opt('json') : path.join(ROOT, `tools/out/level${String(def.id).padStart(2, '0')}.path.json`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify({ id: def.id, K, pts: rp.pts }));
      console.log('  path written to ' + path.relative(ROOT, out));
    }
    console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
module.exports = { loadLevels, solve, replay, REQUIRED_K };
