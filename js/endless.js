// Kare Koşusu: endless mode. A long level stitched from short hand-made chunks.
// Every chunk starts and ends as a cube on the floor with a few blocks of empty runway,
// so any order of verified chunks stays beatable (tools/solve-endless.js checks each one).
(function (root) {
  'use strict';
  const KK = root.KK;

  // w = chunk width in blocks; speeds = speeds it was verified at; tier = earliest difficulty tier.
  const CHUNKS = [
    { name: 'tek', w: 9, tier: 0, speeds: ['normal', 'fast', 'faster'], build(b, x) { b.spike(x + 4); } },
    { name: 'ikili', w: 10, tier: 0, speeds: ['normal', 'fast', 'faster'], build(b, x) { b.spike(x + 4, 0, 2); } },
    { name: 'üçlü', w: 11, tier: 0, speeds: ['normal', 'fast'], build(b, x) { b.spike(x + 4, 0, 3); } },
    { name: 'basamak', w: 12, tier: 0, speeds: ['normal', 'fast', 'faster'], build(b, x) { b.block(x + 4, 0, 3, 1); b.spike(x + 7, 0, 1); } },
    { name: 'merdiven', w: 17, tier: 1, speeds: ['normal', 'fast'], build(b, x) { b.block(x + 4, 0, 3, 1); b.block(x + 7, 0, 3, 2); b.spike(x + 10, 0, 3); } },
    { name: 'zıplatıcı', w: 16, tier: 1, speeds: ['normal', 'fast'], build(b, x) { b.pad(x + 4); b.spike(x + 5, 0, 5); } },
    { name: 'halka', w: 16, tier: 1, speeds: ['normal', 'fast'], build(b, x) { b.spike(x + 4, 0, 6); b.orb(x + 6.5, 2); } },
    { name: 'tavan', w: 18, tier: 2, speeds: ['normal', 'fast'], build(b, x) { b.block(x + 3, 3.4, 12, 1); b.spike(x + 6, 0, 1); b.spike(x + 11, 0, 1); } },
    { name: 'gemi', w: 46, tier: 2, speeds: ['normal', 'fast'], build(b, x) {
      b.mode(x + 3, 'ship', { ceil: 9 });
      const gates = [[12, 3.5], [20, 6], [28, 3], [36, 5.5]];
      for (const [dx, c] of gates) { b.block(x + dx, 0, 1, c - 2.25); b.block(x + dx, c + 2.25, 1, 9 - c - 2.25); }
      for (let i = 9; i < 40; i++) if (!gates.some(([dx]) => dx === i)) b.spike(x + i, 0);
      b.mode(x + 41, 'cube');
    } },
    { name: 'top', w: 42, tier: 2, speeds: ['normal'], build(b, x) {
      b.mode(x + 3, 'ball', { ceil: 7 });
      b.spike(x + 11, 0, 3); b.spikeDown(x + 19, 6, 3); b.spike(x + 27, 0, 3);
      b.mode(x + 35, 'cube');
    } },
    { name: 'ufo', w: 44, tier: 3, speeds: ['normal'], build(b, x) {
      b.mode(x + 3, 'ufo', { ceil: 9 });
      const gates = [[12, 4], [20, 5.5], [28, 3.5], [35, 5]];
      for (const [dx, c] of gates) { b.block(x + dx, 0, 1, c - 2.25); b.block(x + dx, c + 2.25, 1, 9 - c - 2.25); }
      for (let i = 9; i < 38; i++) if (!gates.some(([dx]) => dx === i)) b.spike(x + i, 0);
      b.mode(x + 39, 'cube');
    } },
    { name: 'dalga', w: 40, tier: 3, speeds: ['normal'], build(b, x) {
      b.mode(x + 3, 'wave', { ceil: 9 });
      const gates = [[12, 3], [18, 6], [24, 3], [30, 6]];
      for (const [dx, c] of gates) { b.block(x + dx, 0, 1, c - 1.75); b.block(x + dx, c + 1.75, 1, 9 - c - 1.75); }
      for (let i = 9; i < 33; i++) if (!gates.some(([dx]) => dx === i)) b.spike(x + i, 0);
      b.mode(x + 35, 'cube');
    } },
  ];

  function rng(seed) {
    let a = seed >>> 0 || 1;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const LENGTH = 6000;
  // Difficulty tiers by distance, and the speed each tier runs at.
  const TIERS = [{ from: 0, speed: 'normal' }, { from: 250, speed: 'normal' }, { from: 600, speed: 'fast' }, { from: 1100, speed: 'fast' }, { from: 1800, speed: 'faster' }];
  const tierAt = x => { let t = 0; TIERS.forEach((d, i) => { if (x >= d.from) t = i; }); return t; };

  function makeDef(seed) {
    return {
      id: 'endless', name: 'Sonsuz Koşu', difficulty: 'insane', stars: 0, length: LENGTH, hue: 200, bg: 'grid', endless: true, seed,
      music: { bpm: 164, root: 42, scale: 'dorian', prog: [0, 5, 3, 6], drums: 'dnb', lead: 'arp', seed: seed % 1000 },
      build(b) {
        const r = rng(seed);
        let x = 14, speed = 'normal', hue = 200, last = -1;
        while (x < LENGTH - 60) {
          const tier = Math.min(tierAt(x), 3);
          const want = TIERS[Math.min(tierAt(x), TIERS.length - 1)].speed;
          if (want !== speed) {
            b.speed(x + 2, want); speed = want; x += 8;
          }
          const pool = CHUNKS.filter((c, i) => c.tier <= tier && c.speeds.includes(speed) && i !== last);
          const pick = pool[Math.floor(r() * pool.length)];
          last = CHUNKS.indexOf(pick);
          pick.build(b, x);
          // Faster speeds carry a jump further, so leave a little more runway between chunks.
          x += pick.w + (speed === 'faster' ? 3 : speed === 'fast' ? 1 : 0);
          if (r() < 0.12) { hue = (hue + 40 + Math.floor(r() * 80)) % 360; b.color(x, hue); }
        }
      },
    };
  }

  const E = { CHUNKS, makeDef, LENGTH, rng };
  root.KKEndless = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
