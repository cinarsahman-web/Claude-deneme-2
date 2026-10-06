// Kare Koşusu: canvas drawing for the world, objects, player icons and vehicles.
(function (root) {
  'use strict';
  const KK = root.KK;
  const TAU = Math.PI * 2;

  const COLORS = [
    '#ffd23f', '#56f0ff', '#ff3d9a', '#5dff9d', '#ff8a3d', '#b46bff', '#ffffff', '#3d7bff',
    '#ff4040', '#c6ff3d', '#ff9ad1', '#2de0b0', '#8a5cff', '#1b1b2e', '#ffb3f0', '#9ef3ff',
  ];

  const PORTAL_COLORS = {
    cube: '#5dff9d', ship: '#ff3d9a', ball: '#ff8a3d', ufo: '#b46bff', wave: '#56f0ff', robot: '#e6e9ff', spider: '#ff4060',
  };
  const MODE_LABEL = { cube: 'KARE', ship: 'GEMİ', ball: 'TOP', ufo: 'UFO', wave: 'DALGA', robot: 'ROBOT', spider: 'ÖRÜMCEK' };
  const ORB_COLORS = { yellow: '#ffd23f', pink: '#ff7cc0', blue: '#56c8ff', green: '#5dff9d', black: '#2a2a3a' };
  const SPEED_COLORS = { slow: '#ff8a3d', normal: '#56c8ff', fast: '#5dff9d', faster: '#ff3d9a' };
  const SPEED_ARROWS = { slow: 1, normal: 1, fast: 2, faster: 3 };

  // ---------- Icons ----------
  // Each icon draws inside a square of side s centred on the origin, using primary c1 and secondary c2.
  const DARK = '#14101f';
  function frame(c, s, c1) {
    c.fillStyle = c1; c.fillRect(-s / 2, -s / 2, s, s);
    c.lineWidth = Math.max(1.5, s * 0.07); c.strokeStyle = DARK; c.strokeRect(-s / 2, -s / 2, s, s);
  }
  function box(c, x, y, w, h, fill, s) {
    c.fillStyle = fill; c.fillRect(x * s, y * s, w * s, h * s);
    c.lineWidth = Math.max(1, s * 0.05); c.strokeStyle = DARK; c.strokeRect(x * s, y * s, w * s, h * s);
  }
  function poly(c, pts, fill, s, stroke = true) {
    c.beginPath(); c.moveTo(pts[0][0] * s, pts[0][1] * s);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * s, pts[i][1] * s);
    c.closePath(); c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = Math.max(1, s * 0.05); c.strokeStyle = DARK; c.stroke(); }
  }
  function dot(c, x, y, r, fill, s) { c.beginPath(); c.arc(x * s, y * s, r * s, 0, TAU); c.fillStyle = fill; c.fill(); }

  const ICONS = [
    { name: 'Klasik', draw(c, s, a, b) { frame(c, s, a); box(c, -0.3, -0.3, 0.6, 0.6, b, s); box(c, -0.2, -0.16, 0.12, 0.14, DARK, s); box(c, 0.08, -0.16, 0.12, 0.14, DARK, s); box(c, -0.16, 0.08, 0.32, 0.07, DARK, s); } },
    { name: 'Tek Göz', draw(c, s, a, b) { frame(c, s, a); dot(c, 0, -0.02, 0.28, b, s); dot(c, 0.05, -0.02, 0.12, DARK, s); dot(c, 0.09, -0.07, 0.04, '#fff', s); } },
    { name: 'Çapraz', draw(c, s, a, b) { frame(c, s, a); poly(c, [[-0.42, -0.3], [-0.3, -0.42], [0.42, 0.3], [0.3, 0.42]], b, s); poly(c, [[0.42, -0.3], [0.3, -0.42], [-0.42, 0.3], [-0.3, 0.42]], b, s); } },
    { name: 'Elmas', draw(c, s, a, b) { frame(c, s, a); poly(c, [[0, -0.38], [0.38, 0], [0, 0.38], [-0.38, 0]], b, s); poly(c, [[0, -0.15], [0.15, 0], [0, 0.15], [-0.15, 0]], a, s); } },
    { name: 'Hedef', draw(c, s, a, b) { frame(c, s, a); box(c, -0.36, -0.36, 0.72, 0.72, b, s); box(c, -0.24, -0.24, 0.48, 0.48, a, s); box(c, -0.12, -0.12, 0.24, 0.24, b, s); } },
    { name: 'Vizör', draw(c, s, a, b) { frame(c, s, a); box(c, -0.42, -0.2, 0.84, 0.22, b, s); box(c, 0.1, -0.16, 0.22, 0.14, '#fff', s); box(c, -0.3, 0.18, 0.6, 0.12, DARK, s); } },
    { name: 'Kedi', draw(c, s, a, b) { frame(c, s, a); poly(c, [[-0.4, -0.12], [-0.4, -0.42], [-0.12, -0.24]], b, s); poly(c, [[0.4, -0.12], [0.4, -0.42], [0.12, -0.24]], b, s); dot(c, -0.16, 0.02, 0.07, DARK, s); dot(c, 0.16, 0.02, 0.07, DARK, s); poly(c, [[-0.06, 0.14], [0.06, 0.14], [0, 0.22]], b, s); } },
    { name: 'Şimşek', draw(c, s, a, b) { frame(c, s, a); poly(c, [[0.06, -0.42], [-0.26, 0.06], [-0.02, 0.06], [-0.08, 0.42], [0.26, -0.08], [0.02, -0.08]], b, s); } },
    { name: 'Dama', draw(c, s, a, b) { frame(c, s, a); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) box(c, -0.39 + i * 0.26, -0.39 + j * 0.26, 0.26, 0.26, b, s); } },
    { name: 'Kızgın', draw(c, s, a, b) { frame(c, s, a); box(c, -0.36, -0.36, 0.72, 0.72, b, s); poly(c, [[-0.3, -0.18], [-0.06, -0.06], [-0.3, -0.02]], DARK, s, false); poly(c, [[0.3, -0.18], [0.06, -0.06], [0.3, -0.02]], DARK, s, false); box(c, -0.2, 0.16, 0.4, 0.08, DARK, s); } },
    { name: 'Mutlu', draw(c, s, a, b) { frame(c, s, a); dot(c, -0.16, -0.12, 0.08, DARK, s); dot(c, 0.16, -0.12, 0.08, DARK, s); c.beginPath(); c.arc(0, 0.04 * s, 0.22 * s, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = s * 0.08; c.strokeStyle = b; c.stroke(); } },
    { name: 'Kalp', draw(c, s, a, b) { frame(c, s, a); c.save(); c.scale(s, s); c.beginPath(); c.moveTo(0, 0.3); c.bezierCurveTo(-0.45, 0, -0.3, -0.38, 0, -0.14); c.bezierCurveTo(0.3, -0.38, 0.45, 0, 0, 0.3); c.restore(); c.fillStyle = b; c.fill(); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke(); } },
    { name: 'Yıldız', draw(c, s, a, b) { frame(c, s, a); const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.16 : 0.38, an = -Math.PI / 2 + i * Math.PI / 5; pts.push([Math.cos(an) * r, Math.sin(an) * r + 0.03]); } poly(c, pts, b, s); } },
    { name: 'Ok', draw(c, s, a, b) { frame(c, s, a); poly(c, [[-0.36, -0.12], [0.02, -0.12], [0.02, -0.32], [0.38, 0], [0.02, 0.32], [0.02, 0.12], [-0.36, 0.12]], b, s); } },
    { name: 'Çizgili', draw(c, s, a, b) { frame(c, s, a); c.save(); c.beginPath(); c.rect(-0.45 * s, -0.45 * s, 0.9 * s, 0.9 * s); c.clip(); for (let i = -3; i <= 3; i++) poly(c, [[i * 0.28 - 0.5, 0.5], [i * 0.28 - 0.38, 0.5], [i * 0.28 + 0.62, -0.5], [i * 0.28 + 0.5, -0.5]], b, s, false); c.restore(); c.lineWidth = s * 0.07; c.strokeStyle = DARK; c.strokeRect(-s / 2, -s / 2, s, s); } },
    { name: 'Kurukafa', draw(c, s, a, b) { frame(c, s, a); dot(c, 0, -0.06, 0.3, b, s); box(c, -0.18, 0.12, 0.36, 0.2, b, s); dot(c, -0.12, -0.06, 0.09, DARK, s); dot(c, 0.12, -0.06, 0.09, DARK, s); box(c, -0.06, 0.18, 0.04, 0.12, DARK, s); box(c, 0.04, 0.18, 0.04, 0.12, DARK, s); } },
    { name: 'Taç', draw(c, s, a, b) { frame(c, s, a); poly(c, [[-0.34, 0.24], [-0.34, -0.22], [-0.17, 0], [0, -0.3], [0.17, 0], [0.34, -0.22], [0.34, 0.24]], b, s); dot(c, 0, 0.1, 0.06, a, s); } },
    { name: 'Uzaylı', draw(c, s, a, b) { frame(c, s, a); c.save(); c.rotate(0.35); c.beginPath(); c.ellipse(-0.17 * s, 0, 0.15 * s, 0.09 * s, 0, 0, TAU); c.fillStyle = b; c.fill(); c.restore(); c.save(); c.rotate(-0.35); c.beginPath(); c.ellipse(0.17 * s, 0, 0.15 * s, 0.09 * s, 0, 0, TAU); c.fillStyle = b; c.fill(); c.restore(); box(c, -0.05, 0.22, 0.1, 0.05, DARK, s); } },
  ];

  function drawIcon(c, idx, s, c1, c2) { (ICONS[idx] || ICONS[0]).draw(c, s, c1, c2); }

  // Vehicle forms. Origin = centre of the player's box of side s. Drawn upright for normal gravity.
  function drawForm(c, mode, s, ch, t, extra) {
    const a = ch.c1, b = ch.c2, icon = ch.icon;
    switch (mode) {
      case 'ship': {
        c.save(); c.translate(-0.05 * s, -0.2 * s); drawIcon(c, icon, s * 0.5, a, b); c.restore();
        poly(c, [[-0.55, 0], [0.25, 0], [0.62, 0.18], [0.3, 0.4], [-0.5, 0.4], [-0.62, 0.12]], a, s);
        poly(c, [[-0.38, 0.12], [0.18, 0.12], [0.3, 0.24], [-0.38, 0.24]], b, s);
        break;
      }
      case 'ball': {
        c.beginPath(); c.arc(0, 0, s * 0.5, 0, TAU); c.fillStyle = a; c.fill(); c.lineWidth = s * 0.07; c.strokeStyle = DARK; c.stroke();
        c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fillStyle = b; c.fill(); c.lineWidth = s * 0.05; c.stroke();
        for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); poly(c, [[0.3, -0.07], [0.48, 0], [0.3, 0.07]], DARK, s, false); c.restore(); }
        dot(c, 0, 0, 0.1, a, s);
        break;
      }
      case 'ufo': {
        c.beginPath(); c.arc(0, -0.05 * s, s * 0.3, Math.PI, 0); c.fillStyle = 'rgba(200,240,255,.35)'; c.fill(); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke();
        c.save(); c.translate(0, -0.13 * s); drawIcon(c, icon, s * 0.34, a, b); c.restore();
        c.beginPath(); c.ellipse(0, 0.12 * s, s * 0.56, s * 0.2, 0, 0, TAU); c.fillStyle = a; c.fill(); c.lineWidth = s * 0.06; c.strokeStyle = DARK; c.stroke();
        c.beginPath(); c.ellipse(0, 0.12 * s, s * 0.32, s * 0.08, 0, 0, TAU); c.fillStyle = b; c.fill();
        break;
      }
      case 'wave': {
        poly(c, [[-0.45, -0.4], [0.5, 0], [-0.45, 0.4], [-0.25, 0]], a, s);
        poly(c, [[-0.22, -0.16], [0.18, 0], [-0.22, 0.16], [-0.12, 0]], b, s);
        break;
      }
      case 'robot': {
        const k = Math.sin(t * 22) * 0.12;
        c.save(); c.translate(0, -0.12 * s); drawIcon(c, icon, s * 0.66, a, b); c.restore();
        box(c, -0.3 + k, 0.2, 0.16, 0.3, b, s); box(c, 0.12 - k, 0.2, 0.16, 0.3, b, s);
        box(c, -0.36 + k, 0.42, 0.26, 0.08, a, s); box(c, 0.06 - k, 0.42, 0.26, 0.08, a, s);
        break;
      }
      case 'spider': {
        const k = Math.sin(t * 26) * 0.08;
        c.lineWidth = s * 0.09; c.strokeStyle = DARK; c.lineCap = 'round';
        for (const [x0, x1, x2] of [[-0.15, -0.4, -0.5 + k], [0.15, 0.4, 0.5 - k], [-0.1, -0.25, -0.22 - k], [0.1, 0.25, 0.22 + k]]) {
          c.beginPath(); c.moveTo(x0 * s, 0.1 * s); c.lineTo(x1 * s, 0.25 * s); c.lineTo(x2 * s, 0.5 * s); c.stroke();
        }
        c.lineWidth = s * 0.05; c.strokeStyle = b;
        for (const [x0, x1, x2] of [[-0.15, -0.4, -0.5 + k], [0.15, 0.4, 0.5 - k]]) { c.beginPath(); c.moveTo(x0 * s, 0.1 * s); c.lineTo(x1 * s, 0.25 * s); c.lineTo(x2 * s, 0.5 * s); c.stroke(); }
        c.lineCap = 'butt';
        c.save(); c.translate(0, -0.1 * s); drawIcon(c, icon, s * 0.62, a, b); c.restore();
        break;
      }
      default: drawIcon(c, icon, s, a, b);
    }
  }

  // ---------- World ----------
  function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

  function makeView(W, H) {
    const PX = Math.min(H / 12.5, W / 14);
    const GY = Math.min(H - 1.6 * PX, H / 2 + 6.2 * PX);
    return { W, H, PX, GY, camX: 0, camY: 0, visH: GY / PX };
  }

  function drawBackground(c, v, hue, groundHue, t, lowDetail) {
    const g = c.createLinearGradient(0, 0, 0, v.H);
    g.addColorStop(0, `hsl(${hue},70%,24%)`);
    g.addColorStop(1, `hsl(${hue + 18},76%,9%)`);
    c.fillStyle = g; c.fillRect(0, 0, v.W, v.H);
    if (lowDetail) return;
    const size = v.PX * 2.6, off = v.camX * v.PX * 0.18, offY = v.camY * v.PX * 0.18;
    const c0 = Math.floor(off / size) - 1, cols = Math.ceil(v.W / size) + 2;
    const r0 = Math.floor(-offY / size) - 1, rows = Math.ceil(v.H / size) + 2;
    c.lineWidth = 2;
    for (let i = c0; i < c0 + cols; i++) for (let j = r0; j < r0 + rows; j++) {
      const r = hash(i, j);
      if (r > 0.26) continue;
      const x = i * size - off, y = v.H - (j + 1) * size + offY;
      c.strokeStyle = `hsla(${hue + 30},90%,70%,${0.05 + r * 0.25})`;
      c.fillStyle = `hsla(${hue + 30},90%,60%,${r * 0.12})`;
      c.fillRect(x + 6, y + 6, size - 12, size - 12);
      c.strokeRect(x + 6, y + 6, size - 12, size - 12);
    }
  }

  function neonLine(c, x1, y1, x2, y2, color, lowDetail) {
    if (!lowDetail) {
      c.strokeStyle = color; c.globalAlpha = 0.25; c.lineWidth = 9;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.globalAlpha = 1;
    }
    c.strokeStyle = color; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }

  function drawGround(c, v, hue, groundHue, L, lowDetail) {
    const sy0 = v.GY + v.camY * v.PX;
    if (sy0 < v.H) {
      c.fillStyle = `hsl(${groundHue},62%,11%)`;
      c.fillRect(0, sy0, v.W, v.H - sy0);
      c.strokeStyle = `hsla(${groundHue},80%,60%,.22)`; c.lineWidth = 2;
      const tile = 4;
      for (let x = Math.floor(v.camX / tile) * tile; (x - v.camX) * v.PX < v.W; x += tile) {
        c.strokeRect((x - v.camX) * v.PX + 4, sy0 + 6, tile * v.PX - 8, v.PX * 1.6);
      }
      neonLine(c, 0, sy0, v.W, sy0, `hsl(${groundHue - 10},100%,82%)`, lowDetail);
    }
    if (!L) return;
    for (const seg of L.ceilSegs) {
      if (!isFinite(seg.ceil)) continue;
      const a = Math.max(0, (seg.x0 + 0.5 - v.camX) * v.PX), b = Math.min(v.W, (seg.x1 + 0.5 - v.camX) * v.PX);
      if (b <= 0 || a >= v.W) continue;
      const cy = v.GY - (seg.ceil - v.camY) * v.PX;
      if (cy <= 0) continue;
      c.fillStyle = `hsl(${groundHue},62%,11%)`;
      c.fillRect(a, 0, b - a, cy);
      neonLine(c, a, cy, b, cy, `hsl(${groundHue - 10},100%,82%)`, lowDetail);
    }
  }

  function visibleRange(arr, v, pad) {
    const x0 = v.camX - pad, x1 = v.camX + v.W / v.PX + pad;
    return [KK.lowerBound(arr, x0), x1];
  }

  function drawLevel(c, L, v, p, t, hue, lowDetail) {
    const PX = v.PX;
    const sx = x => (x - v.camX) * PX, sy = y => v.GY - (y - v.camY) * PX;

    // Portals behind everything else.
    let [i, x1] = visibleRange(L.portals, v, 3);
    c.font = `${Math.max(9, Math.round(PX * 0.3))}px Bungee, Impact, sans-serif`; c.textAlign = 'center';
    for (; i < L.portals.length && L.portals[i].x < x1; i++) drawPortal(c, L.portals[i], sx, sy, PX, t, L, lowDetail);

    [i, x1] = visibleRange(L.blocks, v, L.maxBlockW + 1);
    for (; i < L.blocks.length && L.blocks[i].x < x1; i++) {
      const b = L.blocks[i];
      if (b.x + b.w < v.camX - 1) continue;
      const x = sx(b.x), y = sy(b.y + b.h), w = b.w * PX, h = b.h * PX;
      c.fillStyle = 'rgba(5,6,20,.93)'; c.fillRect(x, y, w, h);
      if (!lowDetail && !b.slab) {
        c.strokeStyle = `hsla(${hue + 20},90%,70%,.22)`; c.lineWidth = 1;
        for (let a = 0; a < b.w; a++) for (let d = 0; d < b.h; d++) c.strokeRect(x + a * PX + 5, y + d * PX + 5, PX - 10, PX - 10);
      }
      if (!lowDetail) { c.strokeStyle = `hsla(${hue},100%,75%,.35)`; c.lineWidth = 6; c.strokeRect(x + 1, y + 1, w - 2, h - 2); }
      c.strokeStyle = '#fff'; c.lineWidth = 2.2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }

    [i, x1] = visibleRange(L.spikes, v, 2);
    c.lineWidth = 2.2;
    for (; i < L.spikes.length && L.spikes[i].x < x1; i++) {
      const s = L.spikes[i], x = sx(s.x);
      const base = s.dir > 0 ? sy(s.y) : sy(s.y + 1), tip = s.dir > 0 ? sy(s.y + s.h) : sy(s.y + 1 - s.h);
      const inset = s.h < 1 ? PX * 0.18 : 2;
      c.beginPath(); c.moveTo(x + inset, base); c.lineTo(x + PX / 2, tip); c.lineTo(x + PX - inset, base); c.closePath();
      c.fillStyle = 'rgba(5,6,20,.95)'; c.fill(); c.strokeStyle = '#fff'; c.stroke();
    }

    [i, x1] = visibleRange(L.saws, v, L.maxSawR + 2);
    for (; i < L.saws.length && L.saws[i].x < x1; i++) {
      const s = L.saws[i], x = sx(s.x), y = sy(s.y), r = s.r * PX;
      c.save(); c.translate(x, y); c.rotate(t * 6);
      c.beginPath();
      const teeth = Math.max(8, Math.round(s.r * 12));
      for (let k = 0; k < teeth * 2; k++) { const rr = k % 2 ? r * 0.78 : r; const an = k / (teeth * 2) * TAU; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      c.closePath(); c.fillStyle = 'rgba(5,6,20,.95)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.45, 0, TAU); c.strokeStyle = `hsla(${hue},100%,75%,.8)`; c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.12, 0, TAU); c.fillStyle = '#fff'; c.fill();
      c.restore();
    }

    [i, x1] = visibleRange(L.pads, v, 2);
    for (; i < L.pads.length && L.pads[i].x < x1; i++) {
      const d = L.pads[i], used = p && p.used.has(d.id), col = ORB_COLORS[d.type];
      const x = sx(d.x + 0.5), y = d.down ? sy(d.y + 1) : sy(d.y);
      c.save(); c.translate(x, y); if (d.down) c.scale(1, -1);
      c.globalAlpha = used ? 0.45 : 1;
      c.beginPath(); c.ellipse(0, 0, PX * 0.42, PX * 0.22, 0, Math.PI, 0); c.fillStyle = col; c.fill();
      if (!used) { const k = (t * 1.6) % 1; c.globalAlpha = 0.6 * (1 - k); c.fillRect(-PX * 0.3, -PX * (0.3 + k * 1.2), PX * 0.6, 3); }
      c.restore(); c.globalAlpha = 1;
    }

    [i, x1] = visibleRange(L.orbs, v, 2);
    for (; i < L.orbs.length && L.orbs[i].x < x1; i++) {
      const o = L.orbs[i], used = p && p.used.has(o.id), col = ORB_COLORS[o.type];
      const x = sx(o.x + 0.5), y = sy(o.y + 0.5), pulse = 1 + Math.sin(t * 6 + o.x) * 0.07;
      c.globalAlpha = used ? 0.4 : 1;
      if (!lowDetail && !used) { c.beginPath(); c.arc(x, y, PX * 0.55 * pulse, 0, TAU); c.fillStyle = col; c.globalAlpha = 0.15; c.fill(); c.globalAlpha = 1; }
      c.beginPath(); c.arc(x, y, PX * 0.42 * pulse, 0, TAU); c.strokeStyle = o.type === 'black' ? '#fff' : col; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.arc(x, y, PX * 0.26, 0, TAU); c.fillStyle = col; c.fill();
      if (o.type === 'black') { c.strokeStyle = '#ff4060'; c.lineWidth = 2; c.stroke(); }
      c.globalAlpha = 1;
    }

    [i, x1] = visibleRange(L.coins, v, 2);
    for (; i < L.coins.length && L.coins[i].x < x1; i++) {
      const co = L.coins[i];
      if (p && p.coins.has(co.idx)) continue;
      const x = sx(co.x + 0.5), y = sy(co.y + 0.5) + Math.sin(t * 3 + co.x) * PX * 0.06;
      const sq = Math.abs(Math.cos(t * 2.4 + co.idx));
      c.save(); c.translate(x, y); c.scale(Math.max(0.15, sq), 1);
      c.beginPath(); c.arc(0, 0, PX * 0.42, 0, TAU); c.fillStyle = '#f5c542'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#8a5a00'; c.stroke();
      c.beginPath(); c.arc(0, 0, PX * 0.28, 0, TAU); c.strokeStyle = '#fff3b0'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#8a5a00'; c.font = `${Math.round(PX * 0.34)}px Bungee, Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('K', 0, 1); c.textBaseline = 'alphabetic';
      c.restore();
    }

    // Finish line.
    const ex = sx(L.end);
    if (ex < v.W + 20) {
      const g = c.createLinearGradient(ex, 0, ex + PX * 4, 0);
      g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(ex, 0, PX * 4, v.H);
    }
  }

  function drawPortal(c, q, sx, sy, PX, t, L, lowDetail) {
    const x = sx(q.x + 0.5);
    let col, label, cyW, ry;
    if (q.kind === 'mode') {
      col = PORTAL_COLORS[q.value]; label = MODE_LABEL[q.value];
      const ceil = isFinite(q.ceil) ? q.ceil : 6;
      cyW = q.y !== undefined ? q.y : Math.min(ceil, 8) / 2; ry = 1.5;
    } else if (q.kind === 'gravity') {
      col = q.value < 0 ? '#ffd23f' : '#56c8ff'; label = q.value < 0 ? '▲' : '▼'; cyW = q.y !== undefined ? q.y : 2.5; ry = 1.3;
    } else if (q.kind === 'size') {
      col = q.value === 'mini' ? '#ff7cc0' : '#5dff9d'; label = q.value === 'mini' ? 'MİNİ' : 'NORMAL'; cyW = q.y !== undefined ? q.y : 2; ry = q.value === 'mini' ? 0.9 : 1.4;
    } else {
      col = SPEED_COLORS[q.value]; cyW = q.y !== undefined ? q.y : 1.5;
      const y = sy(cyW), n = SPEED_ARROWS[q.value];
      c.save(); c.translate(x, y);
      c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 2;
      for (let k = 0; k < n; k++) {
        const ox = (k - (n - 1) / 2) * PX * 0.42, dir = q.value === 'slow' ? -1 : 1;
        c.beginPath(); c.moveTo(ox - dir * PX * 0.25, -PX * 0.5); c.lineTo(ox + dir * PX * 0.25, 0); c.lineTo(ox - dir * PX * 0.25, PX * 0.5); c.lineTo(ox - dir * PX * 0.05, 0); c.closePath();
        c.fill(); c.stroke();
      }
      c.restore();
      return;
    }
    const y = sy(cyW);
    c.save();
    if (!lowDetail) { c.strokeStyle = col; c.globalAlpha = 0.25; c.lineWidth = 14; c.beginPath(); c.ellipse(x, y, PX * 0.45, PX * ry, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.ellipse(x, y, PX * 0.45, PX * ry, 0, 0, TAU); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, PX * 0.3, PX * ry * 0.85, 0, 0, TAU); c.stroke();
    c.fillStyle = col; c.fillText(label, x, y - PX * ry - PX * 0.2);
    c.restore();
  }

  function drawParticles(c, v, list) {
    for (const q of list) {
      c.globalAlpha = Math.max(0, q.life / q.max);
      c.fillStyle = q.color;
      const s = q.size * v.PX;
      c.fillRect((q.x - v.camX) * v.PX - s / 2, v.GY - (q.y - v.camY) * v.PX - s / 2, s, s);
    }
    c.globalAlpha = 1;
  }

  root.KKRender = {
    COLORS, ICONS, PORTAL_COLORS, MODE_LABEL, ORB_COLORS,
    drawIcon, drawForm, makeView, drawBackground, drawGround, drawLevel, drawParticles, neonLine,
  };
})(window);
