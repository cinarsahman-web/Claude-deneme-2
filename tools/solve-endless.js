#!/usr/bin/env node
// Proves every endless-mode chunk is beatable at each speed it is used at, with a cube starting
// on the floor, and that a few full generated runs are beatable end to end.
const path = require('path');
const KK = require(path.join(__dirname, '../js/physics.js'));
globalThis.KK = KK;
const E = require(path.join(__dirname, '../js/endless.js'));
const { solve } = require('./solve.js');
const K = Number((process.argv.find(a => a.startsWith('--k=')) || '--k=8').split('=')[1]);
let failed = false;
for (const c of E.CHUNKS) for (const sp of c.speeds) {
  const L = KK.buildLevel({ id: 'chunk', length: c.w + 12, start: { speed: sp }, build(b) { c.build(b, 6); } });
  L._byId = new Map([...L.pads, ...L.orbs].map(o => [o.id, o]));
  const r = solve(L, K);
  console.log(`${r.ok ? '✓' : '✗'} ${c.name.padEnd(10)} ${sp.padEnd(7)} ${r.ok ? '' : 'furthest x=' + r.far.toFixed(1)}`);
  if (!r.ok) failed = true;
}
for (const seed of [1, 7, 42]) {
  const def = E.makeDef(seed);
  def.length = 1500;
  const L = KK.buildLevel(def);
  L._byId = new Map([...L.pads, ...L.orbs].map(o => [o.id, o]));
  const r = solve(L, K, { maxStates: 8e6 });
  console.log(`${r.ok ? '✓' : '✗'} full run seed ${seed} (1500 blocks) ${r.ok ? '' : 'furthest x=' + r.far.toFixed(1)}`);
  if (!r.ok) failed = true;
}
console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(failed ? 1 : 0);
