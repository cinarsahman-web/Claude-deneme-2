// Kare Koşusu: physics and level model.
// Shared by the game (browser global `KK`) and the node tools (tools/solve.js).
// Units: 1 = one block. Velocities in blocks per second. y grows upward, the floor is y = 0.
(function (root) {
  'use strict';

  const DT = 1 / 240;
  const SPEEDS = { slow: 8.4, normal: 10.4, fast: 12.96, faster: 15.6 };
  const MODES = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];

  const C = {
    cube: { g: 95, maxFall: 30, jump: 20.5 },
    ship: { acc: 42, max: 9.5 },
    ball: { g: 60, maxFall: 24, flipV: 4 },
    ufo: { g: 60, maxFall: 16, jump: 14 },
    robot: { g: 95, maxFall: 30, jump: 16, boost: 0.15 },
    spider: { g: 95, maxFall: 30 },
  };
  // Vertical speed given by a yellow orb / yellow pad, per mode.
  const ORB_V = { cube: 19, robot: 19, spider: 19, ball: 15, ufo: 14, ship: 9, wave: 0 };
  const PAD_V = { cube: 27, robot: 27, spider: 27, ball: 20, ufo: 18, ship: 12, wave: 0 };
  const PINK = 0.72, BLUE_PAD_V = 14, BLUE_ORB_V = 6, BLACK_V = 26;
  const MINI = 0.6, MINI_K = 0.8;
  const SNAP = 0.2;
  // Default ceilings a mode portal sets when the level does not give one.
  const DEFAULT_CEIL = { ship: 9, ufo: 9, wave: 9 };
  // Modes that may touch the underside of blocks without dying.
  const CAN_BUMP = { ship: 1, ball: 1, ufo: 1, wave: 1, spider: 1 };
  const DIFFICULTIES = {
    easy: { label: 'Kolay', color: '#56c8ff' },
    normal: { label: 'Normal', color: '#5dff9d' },
    hard: { label: 'Zor', color: '#ffd23f' },
    harder: { label: 'Daha Zor', color: '#ff8a3d' },
    insane: { label: 'Çılgın', color: '#ff3d9a' },
    demon: { label: 'Şeytani', color: '#c13dff' },
  };

  const levels = [];
  function registerLevel(def) {
    levels.push(def);
    levels.sort((a, b) => a.id - b.id);
  }

  // Binary search: first index whose .x >= x in an array sorted by x.
  function lowerBound(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid].x < x) lo = mid + 1; else hi = mid; }
    return lo;
  }

  function buildLevel(def) {
    const L = {
      id: def.id, name: def.name, def,
      blocks: [], spikes: [], saws: [], pads: [], orbs: [], portals: [], coins: [], colors: [],
      end: def.length || 300,
      start: Object.assign({ mode: 'cube', speed: 'normal', grav: 1, size: 'normal', ceil: undefined }, def.start || {}),
      maxBlockW: 1,
    };
    let nextId = 1;
    const b = {
      block(x, y, w = 1, h = 1) { L.blocks.push({ x, y, w, h }); },
      slab(x, y, w = 1) { L.blocks.push({ x, y, w, h: 0.5, slab: true }); },
      spike(x, y = 0, n = 1) { for (let i = 0; i < n; i++) L.spikes.push({ x: x + i, y, h: 1, dir: 1 }); },
      spikeDown(x, y, n = 1) { for (let i = 0; i < n; i++) L.spikes.push({ x: x + i, y, h: 1, dir: -1 }); },
      miniSpike(x, y = 0, n = 1) { for (let i = 0; i < n; i++) L.spikes.push({ x: x + i, y, h: 0.5, dir: 1 }); },
      miniSpikeDown(x, y, n = 1) { for (let i = 0; i < n; i++) L.spikes.push({ x: x + i, y, h: 0.5, dir: -1 }); },
      saw(x, y, r = 1) { L.saws.push({ x, y, r }); },
      pad(x, y = 0, type = 'yellow', down = false) { L.pads.push({ x, y, type, down, id: nextId++ }); },
      orb(x, y, type = 'yellow') { L.orbs.push({ x, y, type, id: nextId++ }); },
      mode(x, mode, opts = {}) {
        if (!MODES.includes(mode)) throw new Error('Unknown mode ' + mode);
        const ceil = opts.ceil !== undefined ? opts.ceil : (DEFAULT_CEIL[mode] !== undefined ? DEFAULT_CEIL[mode] : Infinity);
        L.portals.push({ x, kind: 'mode', value: mode, ceil, y: opts.y });
      },
      gravity(x, dir, opts = {}) { L.portals.push({ x, kind: 'gravity', value: dir === 'flip' ? -1 : 1, y: opts.y }); },
      speed(x, s, opts = {}) {
        if (!SPEEDS[s]) throw new Error('Unknown speed ' + s);
        L.portals.push({ x, kind: 'speed', value: s, y: opts.y });
      },
      size(x, s, opts = {}) { L.portals.push({ x, kind: 'size', value: s === 'mini' ? 'mini' : 'normal', y: opts.y }); },
      coin(x, y) { L.coins.push({ x, y, id: nextId++, idx: L.coins.length }); },
      color(x, hue, ground) { L.colors.push({ x, hue, ground: ground === undefined ? hue : ground }); },
      end(x) { L.end = x; },
    };
    def.build(b);
    for (const k of ['blocks', 'spikes', 'saws', 'pads', 'orbs', 'portals', 'coins', 'colors']) L[k].sort((a, c) => a.x - c.x);
    for (const bl of L.blocks) L.maxBlockW = Math.max(L.maxBlockW, bl.w);
    L.maxSawR = L.saws.reduce((m, s) => Math.max(m, s.r), 0);
    return L;
  }

  function newPlayer(L) {
    const s = L.start;
    const mode = s.mode;
    const ceil = s.ceil !== undefined ? s.ceil : (DEFAULT_CEIL[mode] !== undefined ? DEFAULT_CEIL[mode] : Infinity);
    const size = s.size === 'mini' ? MINI : 1;
    const grav = s.grav === -1 || s.grav === 'flip' ? -1 : 1;
    return {
      x: 0, y: grav < 0 && isFinite(ceil) ? ceil - size : 0, vy: 0,
      mode, grav, speed: SPEEDS[s.speed] || SPEEDS.normal, size, ceil,
      grounded: true, dead: false, won: false,
      used: new Set(), coins: new Set(), pi: 0,
      jumpBuf: 0, holdPrev: false, boost: 0,
    };
  }

  function clonePlayer(p) {
    return Object.assign({}, p, { used: new Set(p.used), coins: new Set(p.coins) });
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // Box used against blocks (solid geometry). The wave has a small core box.
  function solidInset(p) { return p.mode === 'wave' ? p.size * 0.25 : 0.02 * p.size; }
  function solidInsetY(p) { return p.mode === 'wave' ? p.size * 0.25 : 0; }
  // Box used against hazards (spikes, saws). Forgiving like the original game.
  function hazardInset(p) { return p.mode === 'wave' ? p.size * 0.3 : p.size * 0.12; }

  function gravityStep(p, g, maxFall, dt) {
    p.vy -= p.grav * g * dt;
    if (p.grav > 0) { if (p.vy < -maxFall) p.vy = -maxFall; }
    else if (p.vy > maxFall) p.vy = maxFall;
  }

  function applyPortal(p, q, ev) {
    if (q.kind === 'mode') {
      const changed = p.mode !== q.value;
      p.mode = q.value; p.ceil = q.ceil; p.boost = 0;
      if (changed && (p.mode === 'ship' || p.mode === 'ufo')) p.vy *= 0.5;
      if (p.y + p.size > p.ceil) p.y = p.ceil - p.size;
      if (changed) ev && ev.push({ type: 'portal', kind: 'mode', value: q.value });
    } else if (q.kind === 'gravity') {
      if (p.grav !== q.value) {
        p.grav = q.value; p.vy *= 0.5; p.grounded = false;
        ev && ev.push({ type: 'portal', kind: 'gravity', value: q.value });
      }
    } else if (q.kind === 'speed') {
      p.speed = SPEEDS[q.value];
      ev && ev.push({ type: 'portal', kind: 'speed', value: q.value });
    } else if (q.kind === 'size') {
      const ns = q.value === 'mini' ? MINI : 1;
      if (ns !== p.size) {
        if (p.grav < 0) p.y += p.size - ns;
        p.size = ns;
        ev && ev.push({ type: 'portal', kind: 'size', value: q.value });
      }
    }
  }

  // Spider: find the surface on the opposite side and snap to it.
  function spiderTarget(p, L) {
    const s = p.size, x0 = p.x + 0.1 * s, x1 = p.x + 0.9 * s;
    let best = null;
    const from = lowerBound(L.blocks, p.x - L.maxBlockW - 1);
    if (p.grav > 0) {
      const head = p.y + s - 0.01;
      if (isFinite(p.ceil)) best = p.ceil;
      for (let i = from; i < L.blocks.length; i++) {
        const b = L.blocks[i];
        if (b.x > x1) break;
        if (b.x + b.w <= x0) continue;
        if (b.y >= head && (best === null || b.y < best)) best = b.y;
      }
      return best === null ? null : best - s;
    } else {
      const feet = p.y + 0.01;
      best = 0;
      for (let i = from; i < L.blocks.length; i++) {
        const b = L.blocks[i];
        if (b.x > x1) break;
        if (b.x + b.w <= x0) continue;
        const top = b.y + b.h;
        if (top <= feet && top > best) best = top;
      }
      return best;
    }
  }

  function step(p, L, dt, hold, ev) {
    if (p.dead || p.won) return;
    if (hold && !p.holdPrev) p.jumpBuf = 0.1;
    p.holdPrev = hold;
    const prevY = p.y;

    while (p.pi < L.portals.length && p.x + p.size / 2 >= L.portals[p.pi].x + 0.5) applyPortal(p, L.portals[p.pi++], ev);

    const s = p.size, k = s < 1 ? MINI_K : 1;

    // Orbs take priority over the mode's own action.
    if (p.jumpBuf > 0) {
      const cx = p.x + s / 2, cy = p.y + s / 2, reach = s / 2 + 0.55;
      for (let i = lowerBound(L.orbs, p.x - 1.5); i < L.orbs.length; i++) {
        const o = L.orbs[i];
        if (o.x > p.x + 1.5) break;
        if (p.used.has(o.id)) continue;
        const dx = cx - (o.x + 0.5), dy = cy - (o.y + 0.5);
        if (dx * dx + dy * dy > reach * reach) continue;
        const g = p.grav, m = p.mode;
        if (o.type === 'yellow') { if (m === 'wave') continue; p.vy = g * ORB_V[m] * k; }
        else if (o.type === 'pink') { if (m === 'wave') continue; p.vy = g * ORB_V[m] * PINK * k; }
        else if (o.type === 'black') { if (m === 'wave') continue; p.vy = -g * BLACK_V; }
        else if (o.type === 'blue') { p.grav = -g; p.vy = g * BLUE_ORB_V; }
        else if (o.type === 'green') { p.grav = -g; p.vy = -g * (m === 'wave' ? 0 : ORB_V[m] * k); }
        p.used.add(o.id); p.jumpBuf = 0; p.grounded = false; p.boost = 0;
        ev && ev.push({ type: 'orb', orb: o });
        break;
      }
    }

    const g = p.grav, m = p.mode;
    if (m === 'cube') {
      if (p.grounded && hold) { p.vy = g * C.cube.jump * k; p.grounded = false; p.jumpBuf = 0; ev && ev.push({ type: 'jump' }); }
      gravityStep(p, C.cube.g, C.cube.maxFall, dt);
    } else if (m === 'ship') {
      const max = C.ship.max * (s < 1 ? 1.1 : 1);
      p.vy += g * (hold ? 1 : -1) * C.ship.acc * dt;
      if (p.vy > max) p.vy = max; else if (p.vy < -max) p.vy = -max;
    } else if (m === 'ball') {
      if (p.grounded && p.jumpBuf > 0) {
        p.grav = -g; p.vy = g * C.ball.flipV; p.grounded = false; p.jumpBuf = 0;
        ev && ev.push({ type: 'jump' });
      }
      gravityStep(p, C.ball.g, C.ball.maxFall, dt);
    } else if (m === 'ufo') {
      if (p.jumpBuf > 0) { p.vy = g * C.ufo.jump * (s < 1 ? 0.85 : 1); p.jumpBuf = 0; p.grounded = false; ev && ev.push({ type: 'jump' }); }
      gravityStep(p, C.ufo.g, C.ufo.maxFall, dt);
    } else if (m === 'wave') {
      p.vy = g * (hold ? 1 : -1) * p.speed * (s < 1 ? 2 : 1);
    } else if (m === 'robot') {
      if (p.grounded && hold) { p.vy = g * C.robot.jump * k; p.boost = C.robot.boost; p.grounded = false; ev && ev.push({ type: 'jump' }); }
      if (p.boost > 0 && hold) { p.boost -= dt; p.vy = g * C.robot.jump * k; }
      else { p.boost = 0; gravityStep(p, C.robot.g, C.robot.maxFall, dt); }
    } else if (m === 'spider') {
      if (p.grounded && p.jumpBuf > 0) {
        const ty = spiderTarget(p, L);
        const fromY = p.y;
        p.jumpBuf = 0; p.grav = -g; p.vy = 0;
        if (ty !== null) { p.y = ty; p.grounded = true; }
        else { p.grounded = false; p.vy = g * 8; }
        ev && ev.push({ type: 'spider', fromY, toY: p.y });
      }
      gravityStep(p, C.spider.g, C.spider.maxFall, dt);
    }

    p.x += p.speed * dt;
    p.y += p.vy * dt;
    p.grounded = false;

    const sz = p.size, gg = p.grav;
    // Floor and ceiling.
    if (p.y < 0) {
      p.y = 0;
      if (p.vy < 0) p.vy = 0;
      if (gg > 0) p.grounded = true;
    }
    if (p.y + sz > p.ceil) {
      p.y = p.ceil - sz;
      if (p.vy > 0) p.vy = 0;
      if (gg < 0) p.grounded = true;
    }

    // Solid blocks.
    const inX = solidInset(p), inY = solidInsetY(p);
    const bw = sz - 2 * inX, bh = sz - 2 * inY;
    const prevBy = prevY + inY;
    const bump = CAN_BUMP[p.mode];
    for (let i = lowerBound(L.blocks, p.x - L.maxBlockW - 1); i < L.blocks.length; i++) {
      const b = L.blocks[i];
      if (b.x > p.x + sz) break;
      const bx = p.x + inX, by = p.y + inY;
      if (!overlap(bx, by, bw, bh, b.x, b.y, b.w, b.h)) continue;
      const top = b.y + b.h, bottom = b.y;
      if (gg > 0) {
        if (p.vy <= 0 && prevBy >= top - SNAP) { p.y = top - inY; p.vy = 0; p.grounded = true; continue; }
        if (bump && p.vy >= 0 && prevBy + bh <= bottom + SNAP) { p.y = bottom - bh - inY; p.vy = 0; continue; }
      } else {
        if (p.vy >= 0 && prevBy + bh <= bottom + SNAP) { p.y = bottom - bh - inY; p.vy = 0; p.grounded = true; continue; }
        if (bump && p.vy <= 0 && prevBy >= top - SNAP) { p.y = top - inY; p.vy = 0; continue; }
      }
      p.dead = true; ev && ev.push({ type: 'death', cause: 'block' }); return;
    }

    // Hazards.
    const hi = hazardInset(p);
    const hx = p.x + hi, hy = p.y + hi, hw = sz - 2 * hi, hh = sz - 2 * hi;
    for (let i = lowerBound(L.spikes, p.x - 1); i < L.spikes.length; i++) {
      const sp = L.spikes[i];
      if (sp.x > p.x + sz) break;
      const top = sp.dir > 0 ? sp.y : sp.y + 1 - 0.55 * sp.h;
      if (overlap(hx, hy, hw, hh, sp.x + 0.3, top, 0.4, 0.55 * sp.h)) {
        p.dead = true; ev && ev.push({ type: 'death', cause: 'spike' }); return;
      }
    }
    for (let i = lowerBound(L.saws, p.x - L.maxSawR - 1); i < L.saws.length; i++) {
      const sw = L.saws[i];
      if (sw.x - sw.r > p.x + sz) break;
      const nx = Math.max(hx, Math.min(sw.x, hx + hw)), ny = Math.max(hy, Math.min(sw.y, hy + hh));
      const rr = sw.r * 0.8;
      if ((nx - sw.x) * (nx - sw.x) + (ny - sw.y) * (ny - sw.y) < rr * rr) {
        p.dead = true; ev && ev.push({ type: 'death', cause: 'saw' }); return;
      }
    }

    // Pads.
    for (let i = lowerBound(L.pads, p.x - 1); i < L.pads.length; i++) {
      const d = L.pads[i];
      if (d.x > p.x + sz) break;
      if (p.used.has(d.id)) continue;
      const py = d.down ? d.y + 0.7 : d.y;
      if (!overlap(p.x, p.y, sz, sz, d.x + 0.1, py, 0.8, 0.3)) continue;
      const m2 = p.mode, g2 = p.grav, k2 = sz < 1 ? MINI_K : 1;
      if (d.type === 'yellow') { if (m2 === 'wave') continue; p.vy = g2 * PAD_V[m2] * k2; }
      else if (d.type === 'pink') { if (m2 === 'wave') continue; p.vy = g2 * PAD_V[m2] * PINK * k2; }
      else if (d.type === 'blue') { p.grav = -g2; p.vy = g2 * BLUE_PAD_V; }
      p.used.add(d.id); p.grounded = false; p.boost = 0;
      ev && ev.push({ type: 'pad', pad: d });
    }

    // Coins.
    for (let i = lowerBound(L.coins, p.x - 2); i < L.coins.length; i++) {
      const c = L.coins[i];
      if (c.x > p.x + 2) break;
      if (p.coins.has(c.idx)) continue;
      const dx = p.x + sz / 2 - (c.x + 0.5), dy = p.y + sz / 2 - (c.y + 0.5);
      if (dx * dx + dy * dy < 0.9 * 0.9) { p.coins.add(c.idx); ev && ev.push({ type: 'coin', coin: c }); }
    }

    p.jumpBuf -= dt;
    if (p.y > 80) { p.dead = true; ev && ev.push({ type: 'death', cause: 'void' }); return; }
    if (p.x >= L.end) p.won = true;
  }

  const KK = {
    DT, SPEEDS, MODES, DIFFICULTIES, C,
    levels, registerLevel, buildLevel, newPlayer, clonePlayer, step, lowerBound,
  };
  root.KK = KK;
  if (typeof module !== 'undefined' && module.exports) module.exports = KK;
})(typeof window !== 'undefined' ? window : globalThis);
