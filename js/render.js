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

  // ---------- Colour helpers ----------
  const DARK = '#14101f';
  const shadeCache = new Map();
  function toHsl(col) {
    if (col.startsWith('hsl')) {
      const m = col.match(/hsla?\(\s*([-\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 50];
    }
    let h = col.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let hh = 0, sat = 0;
    if (mx !== mn) {
      const d = mx - mn;
      sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh *= 60;
    }
    return [hh, sat * 100, l * 100];
  }
  // Same hue, lightness moved by dl (and optional alpha). Hex inputs are cached; animated hsl() ones are not.
  function shade(col, dl, a) {
    const key = col + '|' + dl + '|' + a;
    const hit = shadeCache.get(key);
    if (hit) return hit;
    const [h, sat, l] = toHsl(col);
    const L = Math.max(0, Math.min(100, l + dl));
    const v = a === undefined ? `hsl(${h.toFixed(1)},${sat.toFixed(1)}%,${L.toFixed(1)}%)` : `hsla(${h.toFixed(1)},${sat.toFixed(1)}%,${L.toFixed(1)}%,${a})`;
    if (col[0] === '#') shadeCache.set(key, v);
    return v;
  }
  // Light-from-top-left gradient for a part of an icon of side s.
  function paint(c, fill, s) {
    if (fill === DARK || fill === '#fff' || fill === '#ffffff' || typeof fill !== 'string') return fill;
    const g = c.createLinearGradient(-s * 0.5, -s * 0.5, s * 0.5, s * 0.5);
    g.addColorStop(0, shade(fill, 16)); g.addColorStop(1, shade(fill, -16));
    return g;
  }

  // ---------- Icons ----------
  // Each icon draws inside a square of side s centred on the origin, using primary c1 and secondary c2.
  function frame(c, s, c1) {
    c.fillStyle = paint(c, c1, s); c.fillRect(-s / 2, -s / 2, s, s);
    if (s >= 14) {
      const w = Math.max(1, s * 0.05), e = s / 2 - w * 1.6;
      c.lineWidth = w;
      c.strokeStyle = 'rgba(255,255,255,.4)';
      c.beginPath(); c.moveTo(-e, e); c.lineTo(-e, -e); c.lineTo(e, -e); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.3)';
      c.beginPath(); c.moveTo(e, -e); c.lineTo(e, e); c.lineTo(-e, e); c.stroke();
    }
    c.lineWidth = Math.max(1.5, s * 0.07); c.strokeStyle = DARK; c.strokeRect(-s / 2, -s / 2, s, s);
  }
  function box(c, x, y, w, h, fill, s) {
    c.fillStyle = paint(c, fill, s); c.fillRect(x * s, y * s, w * s, h * s);
    c.lineWidth = Math.max(1, s * 0.05); c.strokeStyle = DARK; c.strokeRect(x * s, y * s, w * s, h * s);
  }
  function poly(c, pts, fill, s, stroke = true) {
    c.beginPath(); c.moveTo(pts[0][0] * s, pts[0][1] * s);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * s, pts[i][1] * s);
    c.closePath(); c.fillStyle = paint(c, fill, s); c.fill();
    if (stroke) { c.lineWidth = Math.max(1, s * 0.05); c.strokeStyle = DARK; c.stroke(); }
  }
  function dot(c, x, y, r, fill, s) {
    c.beginPath(); c.arc(x * s, y * s, r * s, 0, TAU);
    if (fill === DARK || fill === '#fff' || fill === '#ffffff') c.fillStyle = fill;
    else {
      const g = c.createRadialGradient((x - r * 0.35) * s, (y - r * 0.35) * s, r * s * 0.1, x * s, y * s, r * s);
      g.addColorStop(0, shade(fill, 22)); g.addColorStop(1, shade(fill, -12));
      c.fillStyle = g;
    }
    c.fill();
  }
  // A soft diagonal sheen over the whole icon.
  function gloss(c, s) {
    c.save();
    c.beginPath(); c.rect(-s / 2, -s / 2, s, s); c.clip();
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.beginPath(); c.moveTo(-s / 2, -s / 2); c.lineTo(s * 0.45, -s / 2); c.lineTo(-s / 2, s * 0.2); c.closePath(); c.fill();
    c.restore();
  }

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
    // Owner-only skin: the colours flow through the rainbow over time, whatever colours are picked.
    { name: 'Gökkuşağı', owner: true, draw(c, s) {
      const t = performance.now() / 1000;
      c.save(); c.beginPath(); c.rect(-s / 2, -s / 2, s, s); c.clip();
      for (let i = -4; i <= 4; i++) {
        c.fillStyle = `hsl(${(t * 140 + i * 40) % 360},95%,60%)`;
        c.beginPath(); c.moveTo((i * 0.22 - 0.6) * s, 0.6 * s); c.lineTo((i * 0.22 - 0.38) * s, 0.6 * s);
        c.lineTo((i * 0.22 + 0.6) * s, -0.6 * s); c.lineTo((i * 0.22 + 0.38) * s, -0.6 * s); c.closePath(); c.fill();
      }
      c.restore();
      c.lineWidth = Math.max(1.5, s * 0.07); c.strokeStyle = DARK; c.strokeRect(-s / 2, -s / 2, s, s);
      box(c, -0.3, -0.3, 0.6, 0.6, '#ffffff', s);
      box(c, -0.2, -0.16, 0.12, 0.14, DARK, s); box(c, 0.08, -0.16, 0.12, 0.14, DARK, s);
      c.beginPath(); c.arc(0, 0.06 * s, 0.14 * s, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = s * 0.06; c.strokeStyle = `hsl(${(t * 140) % 360},90%,45%)`; c.stroke();
    } },
    { name: 'Gezegen', draw(c, s, a, b) {
      frame(c, s, a);
      const ring = (from, to) => { c.save(); c.rotate(-0.45); c.beginPath(); c.ellipse(0, 0, 0.44 * s, 0.13 * s, 0, from, to); c.lineWidth = s * 0.09; c.strokeStyle = DARK; c.stroke(); c.lineWidth = s * 0.045; c.strokeStyle = '#fff'; c.stroke(); c.restore(); };
      ring(Math.PI, TAU);
      dot(c, 0, 0, 0.24, b, s); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke();
      ring(0, Math.PI);
      dot(c, -0.33, -0.33, 0.035, '#fff', s); dot(c, 0.3, 0.32, 0.03, '#fff', s); dot(c, 0.34, -0.2, 0.025, '#fff', s);
    } },
    { name: 'Ejder', draw(c, s, a, b) {
      frame(c, s, a);
      c.beginPath(); c.moveTo(-0.38 * s, 0); c.quadraticCurveTo(0, -0.36 * s, 0.38 * s, 0); c.quadraticCurveTo(0, 0.36 * s, -0.38 * s, 0); c.closePath();
      c.fillStyle = paint(c, b, s); c.fill(); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke();
      c.beginPath(); c.ellipse(0, 0, 0.05 * s, 0.16 * s, 0, 0, TAU); c.fillStyle = DARK; c.fill();
      dot(c, 0.08, -0.07, 0.035, '#fff', s);
      poly(c, [[-0.4, -0.3], [-0.18, -0.22], [-0.36, -0.14]], DARK, s, false); poly(c, [[0.4, -0.3], [0.18, -0.22], [0.36, -0.14]], DARK, s, false);
    } },
    { name: 'Piksel', draw(c, s, a, b) {
      frame(c, s, a);
      box(c, -0.38, -0.38, 0.76, 0.76, b, s);
      const map = ['.....', '.d.d.', '.....', 'd...d', '.ddd.'], u = 0.76 / 5;
      c.fillStyle = DARK;
      map.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'd') c.fillRect((-0.38 + i * u) * s, (-0.38 + j * u) * s, u * s + 0.5, u * s + 0.5); }));
    } },
    { name: 'Ninja', draw(c, s, a, b) {
      frame(c, s, a);
      poly(c, [[0.3, -0.16], [0.5, -0.32], [0.46, -0.12]], b, s); poly(c, [[0.3, -0.06], [0.52, 0.02], [0.44, 0.12]], b, s);
      box(c, -0.5, -0.24, 1, 0.26, b, s);
      poly(c, [[-0.3, -0.16], [-0.06, -0.12], [-0.08, -0.04], [-0.3, -0.06]], '#fff', s, false);
      poly(c, [[0.3, -0.16], [0.06, -0.12], [0.08, -0.04], [0.3, -0.06]], '#fff', s, false);
      dot(c, -0.14, -0.09, 0.035, DARK, s); dot(c, 0.14, -0.09, 0.035, DARK, s);
      box(c, -0.14, 0.2, 0.28, 0.05, DARK, s);
    } },
    { name: 'Alev', draw(c, s, a, b) {
      frame(c, s, a);
      const flame = (k, fill) => {
        c.beginPath(); c.moveTo(0, -0.4 * s * k);
        c.bezierCurveTo(0.12 * s * k, -0.18 * s * k, 0.34 * s * k, -0.06 * s * k, 0.26 * s * k, 0.18 * s * k);
        c.bezierCurveTo(0.2 * s * k, 0.36 * s * k, -0.2 * s * k, 0.36 * s * k, -0.26 * s * k, 0.18 * s * k);
        c.bezierCurveTo(-0.32 * s * k, 0.0, -0.1 * s * k, -0.12 * s * k, 0, -0.4 * s * k);
        c.closePath(); c.fillStyle = fill; c.fill();
      };
      c.save(); c.translate(0, 0.06 * s);
      flame(1, paint(c, b, s)); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke();
      c.translate(0, 0.08 * s); flame(0.55, shade(b, 28));
      c.restore();
    } },
    { name: 'Kristal', draw(c, s, a, b) {
      frame(c, s, a);
      poly(c, [[0, -0.4], [0.3, -0.12], [0.18, 0.36], [-0.18, 0.36], [-0.3, -0.12]], b, s);
      poly(c, [[0, -0.4], [0.3, -0.12], [0, -0.02]], shade(b, 22), s, false);
      poly(c, [[0, -0.02], [0.3, -0.12], [0.18, 0.36]], shade(b, -14), s, false);
      poly(c, [[0, -0.02], [-0.18, 0.36], [0.18, 0.36]], shade(b, -24), s, false);
      c.lineWidth = Math.max(1, s * 0.04); c.strokeStyle = DARK;
      c.beginPath(); c.moveTo(-0.3 * s, -0.12 * s); c.lineTo(0, -0.02 * s); c.lineTo(0.3 * s, -0.12 * s); c.moveTo(0, -0.02 * s); c.lineTo(0, -0.4 * s); c.moveTo(-0.18 * s, 0.36 * s); c.lineTo(0, -0.02 * s); c.lineTo(0.18 * s, 0.36 * s); c.stroke();
    } },
  ];

  function drawIcon(c, idx, s, c1, c2) {
    (ICONS[idx] || ICONS[0]).draw(c, s, c1, c2);
    if (s >= 14) gloss(c, s);
  }

  // Vehicle forms. Origin = centre of the player's box of side s. Drawn upright for normal gravity.
  function drawForm(c, mode, s, ch, t) {
    const a = ch.c1, b = ch.c2, icon = ch.icon;
    switch (mode) {
      case 'ship': {
        // Engine flame, flickering.
        const f = 0.8 + Math.sin(t * 43) * 0.12 + Math.sin(t * 71) * 0.08;
        const fg = c.createLinearGradient(-0.55 * s, 0, -1.0 * s, 0);
        fg.addColorStop(0, '#fff7c8'); fg.addColorStop(0.35, '#ffb43d'); fg.addColorStop(1, 'rgba(255,60,60,0)');
        c.beginPath(); c.moveTo(-0.56 * s, 0.1 * s); c.quadraticCurveTo((-0.62 - 0.4 * f) * s, 0.2 * s, -0.56 * s, 0.32 * s); c.closePath();
        c.fillStyle = fg; c.fill();
        c.save(); c.translate(-0.05 * s, -0.2 * s); drawIcon(c, icon, s * 0.5, a, b); c.restore();
        poly(c, [[-0.55, 0], [0.25, 0], [0.62, 0.18], [0.3, 0.4], [-0.5, 0.4], [-0.62, 0.12]], a, s);
        poly(c, [[-0.38, 0.12], [0.18, 0.12], [0.3, 0.24], [-0.38, 0.24]], b, s);
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, s * 0.035);
        c.beginPath(); c.moveTo(-0.48 * s, 0.05 * s); c.lineTo(0.22 * s, 0.05 * s); c.stroke();
        break;
      }
      case 'ball': {
        const g = c.createRadialGradient(-0.18 * s, -0.18 * s, 0.04 * s, 0, 0, 0.5 * s);
        g.addColorStop(0, shade(a, 26)); g.addColorStop(0.7, a); g.addColorStop(1, shade(a, -22));
        c.beginPath(); c.arc(0, 0, s * 0.5, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = s * 0.07; c.strokeStyle = DARK; c.stroke();
        dot(c, 0, 0, 0.3, b, s); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke();
        for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); poly(c, [[0.3, -0.07], [0.48, 0], [0.3, 0.07]], DARK, s, false); c.restore(); }
        dot(c, 0, 0, 0.1, a, s);
        c.beginPath(); c.arc(-0.16 * s, -0.16 * s, 0.12 * s, 0, TAU); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill();
        break;
      }
      case 'ufo': {
        const dg = c.createLinearGradient(0, -0.35 * s, 0, 0);
        dg.addColorStop(0, 'rgba(220,250,255,.55)'); dg.addColorStop(1, 'rgba(120,200,255,.18)');
        c.beginPath(); c.arc(0, -0.05 * s, s * 0.3, Math.PI, 0); c.fillStyle = dg; c.fill();
        c.save(); c.translate(0, -0.13 * s); drawIcon(c, icon, s * 0.34, a, b); c.restore();
        c.beginPath(); c.arc(0, -0.05 * s, s * 0.3, Math.PI, 0); c.lineWidth = s * 0.05; c.strokeStyle = DARK; c.stroke();
        c.beginPath(); c.arc(-0.1 * s, -0.16 * s, s * 0.12, Math.PI * 1.1, Math.PI * 1.45); c.lineWidth = s * 0.04; c.strokeStyle = 'rgba(255,255,255,.7)'; c.stroke();
        const sg = c.createLinearGradient(0, -0.08 * s, 0, 0.32 * s);
        sg.addColorStop(0, shade(a, 20)); sg.addColorStop(1, shade(a, -20));
        c.beginPath(); c.ellipse(0, 0.12 * s, s * 0.56, s * 0.2, 0, 0, TAU); c.fillStyle = sg; c.fill(); c.lineWidth = s * 0.06; c.strokeStyle = DARK; c.stroke();
        c.beginPath(); c.ellipse(0, 0.12 * s, s * 0.32, s * 0.08, 0, 0, TAU); c.fillStyle = paint(c, b, s); c.fill();
        for (let i = 0; i < 5; i++) {
          const on = Math.floor(t * 6 + i) % 2 === 0;
          c.beginPath(); c.arc((-0.4 + i * 0.2) * s, 0.2 * s, s * 0.035, 0, TAU);
          c.fillStyle = on ? '#fff' : shade(b, -10); c.fill();
        }
        break;
      }
      case 'wave': {
        poly(c, [[-0.45, -0.4], [0.5, 0], [-0.45, 0.4], [-0.25, 0]], a, s);
        poly(c, [[-0.22, -0.16], [0.18, 0], [-0.22, 0.16], [-0.12, 0]], b, s);
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, s * 0.04);
        c.beginPath(); c.moveTo(-0.4 * s, -0.33 * s); c.lineTo(0.4 * s, -0.03 * s); c.stroke();
        break;
      }
      case 'robot': {
        const k = Math.sin(t * 22) * 0.12;
        for (const [hx, side] of [[-0.18, 1], [0.18, -1]]) {
          const fx = hx + side * k * 0.6;
          c.lineCap = 'round';
          c.lineWidth = s * 0.13; c.strokeStyle = DARK;
          c.beginPath(); c.moveTo(hx * s, 0.14 * s); c.lineTo((fx - 0.04) * s, 0.3 * s); c.lineTo(fx * s, 0.44 * s); c.stroke();
          c.lineWidth = s * 0.07; c.strokeStyle = shade(b, 10);
          c.stroke();
          dot(c, fx - 0.04, 0.3, 0.05, '#fff', s);
          c.lineCap = 'butt';
          box(c, fx - 0.13, 0.42, 0.26, 0.08, a, s);
        }
        c.save(); c.translate(0, -0.12 * s); drawIcon(c, icon, s * 0.66, a, b); c.restore();
        break;
      }
      case 'spider': {
        const k = Math.sin(t * 26) * 0.08;
        const legs = [[-0.15, -0.42, -0.5 + k], [0.15, 0.42, 0.5 - k], [-0.1, -0.26, -0.22 - k], [0.1, 0.26, 0.22 + k]];
        c.lineCap = 'round'; c.lineJoin = 'round';
        for (const [x0, x1, x2] of legs) {
          c.beginPath(); c.moveTo(x0 * s, 0.1 * s); c.lineTo(x1 * s, 0.22 * s); c.lineTo(x2 * s, 0.5 * s);
          c.lineWidth = s * 0.1; c.strokeStyle = DARK; c.stroke();
          c.lineWidth = s * 0.05; c.strokeStyle = shade(b, 6); c.stroke();
          dot(c, x1, 0.22, 0.04, '#fff', s);
        }
        c.lineCap = 'butt'; c.lineJoin = 'miter';
        c.save(); c.translate(0, -0.1 * s); drawIcon(c, icon, s * 0.62, a, b); c.restore();
        break;
      }
      default: drawIcon(c, icon, s, a, b);
    }
  }

  // ---------- World ----------
  function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  const mod = (a, n) => ((a % n) + n) % n;

  const THEMES = ['grid', 'orbs', 'city', 'peaks', 'space'];
  function themeFor(def) { return def && def.bg ? def.bg : def && def.id ? THEMES[(def.id - 1) % THEMES.length] : 'grid'; }

  function makeView(W, H) {
    const PX = Math.min(H / 12.5, W / 14);
    const GY = Math.min(H - 1.6 * PX, H / 2 + 6.2 * PX);
    return { W, H, PX, GY, camX: 0, camY: 0, visH: GY / PX };
  }

  // beat: 1 on each music beat, decaying to 0 before the next.
  function drawBackground(c, v, hue, groundHue, t, lowDetail, theme, beat) {
    beat = beat || 0;
    const g = c.createLinearGradient(0, 0, 0, v.H);
    g.addColorStop(0, `hsl(${hue},70%,${25 + beat * 5}%)`);
    g.addColorStop(0.55, `hsl(${hue + 10},72%,${15 + beat * 3}%)`);
    g.addColorStop(1, `hsl(${hue + 18},76%,8%)`);
    c.fillStyle = g; c.fillRect(0, 0, v.W, v.H);
    if (lowDetail) return;
    const floorY = v.GY + v.camY * v.PX;
    switch (theme || 'grid') {
      case 'orbs': bgOrbs(c, v, hue, t); break;
      case 'city': bgCity(c, v, hue, floorY); break;
      case 'peaks': bgPeaks(c, v, hue, floorY); break;
      case 'space': bgSpace(c, v, hue, t); break;
      default: bgGrid(c, v, hue, t);
    }
    // Glow along the horizon, pulsing with the music.
    const hg = c.createLinearGradient(0, floorY - v.PX * 4, 0, floorY);
    hg.addColorStop(0, `hsla(${groundHue},100%,65%,0)`); hg.addColorStop(1, `hsla(${groundHue},100%,65%,${0.14 + beat * 0.12})`);
    c.fillStyle = hg; c.fillRect(0, floorY - v.PX * 4, v.W, v.PX * 4);
    // Drifting dust.
    c.fillStyle = `hsla(${hue + 40},100%,85%,.35)`;
    for (let i = 0; i < 26; i++) {
      const sp = 0.2 + hash(i, 9) * 0.5;
      const x = mod(hash(i, 7) * v.W * 1.3 - v.camX * v.PX * sp - t * 12 * sp, v.W * 1.3) - v.W * 0.15;
      const y = hash(i, 8) * floorY + Math.sin(t * 0.8 + i) * 6;
      const r = 1 + hash(i, 10) * 1.8;
      c.fillRect(x, y, r, r);
    }
  }

  function bgGrid(c, v, hue, t) {
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
    // Slow light shafts.
    for (let k = 0; k < 3; k++) {
      const x = mod(k * v.W * 0.45 - v.camX * v.PX * 0.05 + t * 8, v.W * 1.4) - v.W * 0.2;
      c.fillStyle = `hsla(${hue + 30},100%,80%,.045)`;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + v.PX * 2, 0); c.lineTo(x - v.PX * 3, v.H); c.lineTo(x - v.PX * 5, v.H); c.closePath(); c.fill();
    }
  }

  function bgOrbs(c, v, hue, t) {
    for (let i = 0; i < 16; i++) {
      const par = 0.05 + hash(i, 2) * 0.2;
      const span = v.W * 1.6;
      const x = mod(hash(i, 1) * span - v.camX * v.PX * par, span) - v.W * 0.3;
      const y = hash(i, 3) * v.H * 0.85 + Math.sin(t * 0.5 + i) * v.PX * 0.4;
      const r = v.PX * (1.2 + hash(i, 4) * 3.2);
      const hh = hue + (hash(i, 5) - 0.5) * 80;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsla(${hh},100%,72%,${0.1 + hash(i, 6) * 0.12})`); g.addColorStop(1, `hsla(${hh},100%,60%,0)`);
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
      c.strokeStyle = `hsla(${hh},100%,80%,.1)`; c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, r * 0.62, 0, TAU); c.stroke();
    }
  }

  function skyline(c, v, floorY, par, unit, hmin, hmax, fill, win, seed) {
    const off = v.camX * v.PX * par;
    const i0 = Math.floor(off / unit) - 1, n = Math.ceil(v.W / unit) + 2;
    c.fillStyle = fill;
    c.beginPath();
    const tops = [];
    for (let i = i0; i < i0 + n; i++) {
      const h = (hmin + hash(i, seed) * (hmax - hmin)) * v.PX;
      const w = unit * (0.7 + hash(i, seed + 1) * 0.3);
      const x = i * unit - off;
      c.rect(x, floorY - h, w, h);
      tops.push([x, floorY - h, w, h, i]);
    }
    c.fill();
    if (!win) return;
    c.fillStyle = win;
    c.beginPath();
    const ws = Math.max(3, v.PX * 0.16);
    for (const [x, y, w, h, i] of tops) {
      for (let wy = y + ws * 2; wy < floorY - ws * 2; wy += ws * 2.4) {
        for (let wx = x + ws; wx < x + w - ws * 1.5; wx += ws * 2.2) {
          if (hash(i * 31 + Math.round(wx), Math.round(wy)) > 0.62) c.rect(wx, wy, ws, ws * 1.2);
        }
      }
    }
    c.fill();
  }
  function bgCity(c, v, hue, floorY) {
    skyline(c, v, floorY, 0.08, v.PX * 2.4, 3, 9, `hsla(${hue + 15},45%,22%,.7)`, `hsla(${hue + 50},100%,75%,.25)`, 11);
    skyline(c, v, floorY, 0.2, v.PX * 3.2, 1.5, 6, `hsla(${hue + 5},55%,11%,.92)`, `hsla(${hue + 40},100%,70%,.45)`, 21);
  }

  function ridge(c, v, floorY, par, unit, hmin, hmax, fill, edge, seed) {
    const off = v.camX * v.PX * par;
    const i0 = Math.floor(off / unit) - 1, n = Math.ceil(v.W / unit) + 3;
    c.beginPath(); c.moveTo(i0 * unit - off, floorY);
    for (let i = i0; i < i0 + n; i++) {
      const x = i * unit - off;
      const h = (hmin + hash(i, seed) * (hmax - hmin)) * v.PX;
      c.lineTo(x + unit * 0.5, floorY - h);
      c.lineTo(x + unit, floorY - h * 0.25 * hash(i, seed + 3));
    }
    c.lineTo((i0 + n) * unit - off, floorY); c.closePath();
    c.fillStyle = fill; c.fill();
    c.strokeStyle = edge; c.lineWidth = 1.5; c.stroke();
  }
  function bgPeaks(c, v, hue, floorY) {
    ridge(c, v, floorY, 0.07, v.PX * 4, 4, 9, `hsla(${hue + 20},45%,22%,.65)`, `hsla(${hue + 30},100%,75%,.18)`, 41);
    ridge(c, v, floorY, 0.18, v.PX * 3, 2, 5.5, `hsla(${hue + 8},55%,11%,.9)`, `hsla(${hue + 20},100%,70%,.35)`, 51);
  }

  function bgSpace(c, v, hue, t) {
    for (const [hh, fx, fy, fr] of [[hue + 60, 0.25, 0.3, 0.45], [hue - 40, 0.75, 0.2, 0.5]]) {
      const x = mod(fx * v.W - v.camX * v.PX * 0.02, v.W * 1.2), y = fy * v.H, r = fr * Math.max(v.W, v.H);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsla(${hh},90%,60%,.16)`); g.addColorStop(1, `hsla(${hh},90%,40%,0)`);
      c.fillStyle = g; c.fillRect(0, 0, v.W, v.H);
    }
    for (let i = 0; i < 110; i++) {
      const par = 0.03 + hash(i, 12) * 0.12;
      const x = mod(hash(i, 13) * v.W * 1.2 - v.camX * v.PX * par, v.W * 1.2) - v.W * 0.1;
      const y = hash(i, 14) * v.H * 0.9;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash(i, 15) * 2) + i));
      const r = hash(i, 16) < 0.1 ? 2.4 : 1.4;
      c.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.55})`;
      c.fillRect(x, y, r, r);
    }
  }

  function neonLine(c, x1, y1, x2, y2, color, lowDetail, glow) {
    if (!lowDetail) {
      c.strokeStyle = color; c.globalAlpha = 0.22; c.lineWidth = 9 + (glow || 0) * 10;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.globalAlpha = 1;
    }
    c.strokeStyle = color; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }

  function drawGround(c, v, hue, groundHue, L, lowDetail, beat) {
    beat = beat || 0;
    const sy0 = v.GY + v.camY * v.PX, PX = v.PX;
    const lineCol = `hsl(${groundHue - 10},100%,${80 + beat * 10}%)`;
    if (sy0 < v.H) {
      const g = c.createLinearGradient(0, sy0, 0, v.H);
      g.addColorStop(0, `hsl(${groundHue},58%,17%)`); g.addColorStop(1, `hsl(${groundHue},64%,6%)`);
      c.fillStyle = g; c.fillRect(0, sy0, v.W, v.H - sy0);
      const tile = 4;
      c.lineWidth = 2;
      for (let x = Math.floor(v.camX / tile) * tile; (x - v.camX) * PX < v.W; x += tile) {
        const tx = (x - v.camX) * PX;
        c.strokeStyle = `hsla(${groundHue},80%,60%,.2)`;
        c.strokeRect(tx + 4, sy0 + 6, tile * PX - 8, PX * 1.6);
        if (!lowDetail) { c.strokeStyle = `hsla(${groundHue},90%,80%,.1)`; c.beginPath(); c.moveTo(tx + 8, sy0 + 10); c.lineTo(tx + tile * PX - 12, sy0 + 10); c.stroke(); }
      }
      if (!lowDetail) {
        const rg = c.createLinearGradient(0, sy0, 0, sy0 + PX * 0.8);
        rg.addColorStop(0, `hsla(${groundHue},100%,70%,${0.2 + beat * 0.12})`); rg.addColorStop(1, `hsla(${groundHue},100%,70%,0)`);
        c.fillStyle = rg; c.fillRect(0, sy0, v.W, PX * 0.8);
      }
      neonLine(c, 0, sy0, v.W, sy0, lineCol, lowDetail, beat);
    }
    if (!L) return;
    for (const seg of L.ceilSegs) {
      if (!isFinite(seg.ceil)) continue;
      const a = Math.max(0, (seg.x0 + 0.5 - v.camX) * PX), b = Math.min(v.W, (seg.x1 + 0.5 - v.camX) * PX);
      if (b <= 0 || a >= v.W) continue;
      const cy = v.GY - (seg.ceil - v.camY) * PX;
      if (cy <= 0) continue;
      const g = c.createLinearGradient(0, cy, 0, 0);
      g.addColorStop(0, `hsl(${groundHue},58%,17%)`); g.addColorStop(1, `hsl(${groundHue},64%,6%)`);
      c.fillStyle = g; c.fillRect(a, 0, b - a, cy);
      if (!lowDetail) {
        const rg = c.createLinearGradient(0, cy, 0, cy - PX * 0.8);
        rg.addColorStop(0, `hsla(${groundHue},100%,70%,${0.2 + beat * 0.12})`); rg.addColorStop(1, `hsla(${groundHue},100%,70%,0)`);
        c.fillStyle = rg; c.fillRect(a, cy - PX * 0.8, b - a, PX * 0.8);
      }
      neonLine(c, a, cy, b, cy, lineCol, lowDetail, beat);
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

    // Blocks: tinted gradient body, cell lines, top sheen, neon outline.
    [i, x1] = visibleRange(L.blocks, v, L.maxBlockW + 1);
    const bodyTop = `hsla(${hue},45%,16%,.95)`, bodyBot = `hsla(${hue},55%,5%,.96)`;
    for (; i < L.blocks.length && L.blocks[i].x < x1; i++) {
      const b = L.blocks[i];
      if (b.x + b.w < v.camX - 1) continue;
      const x = sx(b.x), y = sy(b.y + b.h), w = b.w * PX, h = b.h * PX;
      if (lowDetail) c.fillStyle = 'rgba(5,6,20,.93)';
      else { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, bodyTop); g.addColorStop(1, bodyBot); c.fillStyle = g; }
      c.fillRect(x, y, w, h);
      if (!lowDetail) {
        if (!b.slab) {
          c.strokeStyle = `hsla(${hue + 20},90%,70%,.16)`; c.lineWidth = 1;
          for (let a = 0; a < b.w; a++) for (let d = 0; d < b.h; d++) c.strokeRect(x + a * PX + 5, y + d * PX + 5, PX - 10, PX - 10);
        }
        const sg = c.createLinearGradient(0, y, 0, y + Math.min(h, PX * 0.5));
        sg.addColorStop(0, 'rgba(255,255,255,.16)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = sg; c.fillRect(x + 2, y + 2, w - 4, Math.min(h, PX * 0.5) - 2);
        c.strokeStyle = `hsla(${hue},100%,72%,.32)`; c.lineWidth = 7; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
      }
      c.strokeStyle = '#fff'; c.lineWidth = 2.2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }

    // Spikes: colour glowing up from the base, neon edge.
    [i, x1] = visibleRange(L.spikes, v, 2);
    for (; i < L.spikes.length && L.spikes[i].x < x1; i++) {
      const s = L.spikes[i], x = sx(s.x);
      const base = s.dir > 0 ? sy(s.y) : sy(s.y + 1), tip = s.dir > 0 ? sy(s.y + s.h) : sy(s.y + 1 - s.h);
      const inset = s.h < 1 ? PX * 0.18 : 2;
      c.beginPath(); c.moveTo(x + inset, base); c.lineTo(x + PX / 2, tip); c.lineTo(x + PX - inset, base); c.closePath();
      if (lowDetail) c.fillStyle = 'rgba(5,6,20,.95)';
      else { const g = c.createLinearGradient(0, base, 0, tip); g.addColorStop(0, `hsla(${hue},70%,30%,.97)`); g.addColorStop(1, 'rgba(5,6,20,.97)'); c.fillStyle = g; }
      c.fill();
      if (!lowDetail) { c.strokeStyle = `hsla(${hue},100%,72%,.35)`; c.lineWidth = 5; c.stroke(); }
      c.strokeStyle = '#fff'; c.lineWidth = 2.2; c.stroke();
      if (!lowDetail) {
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x + inset + PX * 0.12, base + (tip - base) * 0.12); c.lineTo(x + PX / 2 - PX * 0.04, tip + (base - tip) * 0.18); c.stroke();
      }
    }

    // Saws: metallic disc with teeth and a motion blur ring.
    [i, x1] = visibleRange(L.saws, v, L.maxSawR + 2);
    for (; i < L.saws.length && L.saws[i].x < x1; i++) {
      const s = L.saws[i], x = sx(s.x), y = sy(s.y), r = s.r * PX;
      c.save(); c.translate(x, y);
      if (!lowDetail) { c.beginPath(); c.arc(0, 0, r * 1.08, 0, TAU); c.strokeStyle = `hsla(${hue},100%,70%,.25)`; c.lineWidth = 6; c.stroke(); }
      c.rotate(t * 6);
      c.beginPath();
      const teeth = Math.max(8, Math.round(s.r * 12));
      for (let k = 0; k < teeth * 2; k++) { const rr = k % 2 ? r * 0.78 : r; const an = k / (teeth * 2) * TAU; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      c.closePath();
      if (lowDetail) c.fillStyle = 'rgba(5,6,20,.95)';
      else { const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r); g.addColorStop(0, `hsl(${hue},20%,62%)`); g.addColorStop(0.55, `hsl(${hue},28%,24%)`); g.addColorStop(1, `hsl(${hue},40%,8%)`); c.fillStyle = g; }
      c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.45, 0, TAU); c.strokeStyle = `hsla(${hue},100%,75%,.85)`; c.stroke();
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, r * 0.32, k * TAU / 3, k * TAU / 3 + 0.9); c.strokeStyle = 'rgba(255,255,255,.5)'; c.stroke(); }
      c.beginPath(); c.arc(0, 0, r * 0.12, 0, TAU); c.fillStyle = '#fff'; c.fill();
      c.restore();
    }

    // Pads: glowing plate with chevrons rising.
    [i, x1] = visibleRange(L.pads, v, 2);
    for (; i < L.pads.length && L.pads[i].x < x1; i++) {
      const d = L.pads[i], used = p && p.used.has(d.id), col = ORB_COLORS[d.type];
      const x = sx(d.x + 0.5), y = d.down ? sy(d.y + 1) : sy(d.y);
      c.save(); c.translate(x, y); if (d.down) c.scale(1, -1);
      c.globalAlpha = used ? 0.45 : 1;
      if (!lowDetail && !used) {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, PX * 0.7);
        g.addColorStop(0, shade(col, 10, 0.45)); g.addColorStop(1, shade(col, 10, 0));
        c.fillStyle = g; c.fillRect(-PX * 0.7, -PX * 0.7, PX * 1.4, PX * 0.7);
      }
      const dg = c.createLinearGradient(0, -PX * 0.22, 0, 0);
      dg.addColorStop(0, shade(col, 25)); dg.addColorStop(1, shade(col, -10));
      c.beginPath(); c.ellipse(0, 0, PX * 0.42, PX * 0.22, 0, Math.PI, 0); c.fillStyle = dg; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.stroke();
      if (!used) {
        c.strokeStyle = col; c.lineWidth = 2.5;
        for (let k = 0; k < 2; k++) {
          const ph = (t * 1.4 + k * 0.5) % 1, yy = -PX * (0.35 + ph * 1.1);
          c.globalAlpha = 0.75 * (1 - ph);
          c.beginPath(); c.moveTo(-PX * 0.22, yy + PX * 0.12); c.lineTo(0, yy); c.lineTo(PX * 0.22, yy + PX * 0.12); c.stroke();
        }
      }
      c.restore(); c.globalAlpha = 1;
    }

    // Orbs: halo, spinning dashed ring, lit core.
    [i, x1] = visibleRange(L.orbs, v, 2);
    for (; i < L.orbs.length && L.orbs[i].x < x1; i++) {
      const o = L.orbs[i], used = p && p.used.has(o.id), col = ORB_COLORS[o.type], black = o.type === 'black';
      const x = sx(o.x + 0.5), y = sy(o.y + 0.5), pulse = 1 + Math.sin(t * 6 + o.x) * 0.07;
      c.globalAlpha = used ? 0.4 : 1;
      if (!lowDetail && !used) {
        const g = c.createRadialGradient(x, y, PX * 0.2, x, y, PX * 0.85 * pulse);
        g.addColorStop(0, shade(black ? '#ff4060' : col, 0, 0.4)); g.addColorStop(1, shade(black ? '#ff4060' : col, 0, 0));
        c.fillStyle = g; c.fillRect(x - PX, y - PX, PX * 2, PX * 2);
      }
      c.setLineDash([PX * 0.2, PX * 0.12]); c.lineDashOffset = -t * PX * 0.8;
      c.beginPath(); c.arc(x, y, PX * 0.44 * pulse, 0, TAU); c.strokeStyle = black ? '#ff4060' : col; c.lineWidth = 3; c.stroke();
      c.setLineDash([]);
      const cg = c.createRadialGradient(x - PX * 0.08, y - PX * 0.08, PX * 0.02, x, y, PX * 0.27);
      if (black) { cg.addColorStop(0, '#555'); cg.addColorStop(1, '#0b0b14'); }
      else { cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.45, col); cg.addColorStop(1, shade(col, -18)); }
      c.beginPath(); c.arc(x, y, PX * 0.27, 0, TAU); c.fillStyle = cg; c.fill();
      c.strokeStyle = black ? '#ff4060' : 'rgba(255,255,255,.85)'; c.lineWidth = 1.5; c.stroke();
      c.globalAlpha = 1;
    }

    // Coins: gold disc with a moving shine and sparkles.
    [i, x1] = visibleRange(L.coins, v, 2);
    for (; i < L.coins.length && L.coins[i].x < x1; i++) {
      const co = L.coins[i];
      if (p && p.coins.has(co.idx)) continue;
      const x = sx(co.x + 0.5), y = sy(co.y + 0.5) + Math.sin(t * 3 + co.x) * PX * 0.06;
      if (!lowDetail) {
        const g = c.createRadialGradient(x, y, PX * 0.2, x, y, PX * 0.9);
        g.addColorStop(0, 'rgba(255,214,90,.35)'); g.addColorStop(1, 'rgba(255,214,90,0)');
        c.fillStyle = g; c.fillRect(x - PX, y - PX, PX * 2, PX * 2);
      }
      const sq = Math.abs(Math.cos(t * 2.4 + co.idx));
      c.save(); c.translate(x, y); c.scale(Math.max(0.15, sq), 1);
      const gg = c.createRadialGradient(-PX * 0.12, -PX * 0.14, PX * 0.04, 0, 0, PX * 0.42);
      gg.addColorStop(0, '#fff6c4'); gg.addColorStop(0.5, '#f5c542'); gg.addColorStop(1, '#b07a0a');
      c.beginPath(); c.arc(0, 0, PX * 0.42, 0, TAU); c.fillStyle = gg; c.fill(); c.lineWidth = 3; c.strokeStyle = '#7a4f00'; c.stroke();
      c.beginPath(); c.arc(0, 0, PX * 0.28, 0, TAU); c.strokeStyle = '#fff3b0'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#8a5a00'; c.font = `${Math.round(PX * 0.34)}px Bungee, Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('K', 0, 1); c.textBaseline = 'alphabetic';
      if (!lowDetail) {
        c.save(); c.beginPath(); c.arc(0, 0, PX * 0.4, 0, TAU); c.clip();
        const sh = ((t * 0.9 + co.idx * 0.3) % 1.6 - 0.3) * PX;
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.beginPath(); c.moveTo(sh - PX * 0.5, -PX * 0.5); c.lineTo(sh - PX * 0.3, -PX * 0.5); c.lineTo(sh - PX * 0.7, PX * 0.5); c.lineTo(sh - PX * 0.9, PX * 0.5); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
      if (!lowDetail) {
        for (let k = 0; k < 2; k++) {
          const ph = (t * 0.7 + k * 0.5 + co.idx * 0.17) % 1, a = Math.sin(ph * Math.PI);
          const ang = (co.idx + k) * 2.1 + Math.floor(t * 0.7 + k * 0.5) * 1.3;
          const px = x + Math.cos(ang) * PX * 0.6, py = y + Math.sin(ang) * PX * 0.6, r = PX * 0.12 * a;
          c.fillStyle = `rgba(255,248,210,${a})`;
          c.beginPath(); c.moveTo(px, py - r); c.lineTo(px + r * 0.25, py); c.lineTo(px, py + r); c.lineTo(px - r * 0.25, py); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(px - r, py); c.lineTo(px, py + r * 0.25); c.lineTo(px + r, py); c.lineTo(px, py - r * 0.25); c.closePath(); c.fill();
        }
      }
    }

    // Finish line: chequered strip with a glow.
    const ex = sx(L.end);
    if (ex < v.W + 20) {
      const g = c.createLinearGradient(ex, 0, ex + PX * 4, 0);
      g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(ex, 0, PX * 4, v.H);
      const q = PX * 0.35;
      for (let k = 0, yy = 0; yy < v.H; k++, yy += q) {
        c.fillStyle = k % 2 ? '#ffffff' : '#14101f'; c.fillRect(ex - q, yy, q, q);
        c.fillStyle = k % 2 ? '#14101f' : '#ffffff'; c.fillRect(ex - q * 2, yy, q, q);
      }
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
      if (!lowDetail) {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, PX * 1.1);
        g.addColorStop(0, shade(col, 0, 0.35)); g.addColorStop(1, shade(col, 0, 0));
        c.fillStyle = g; c.fillRect(-PX * 1.1, -PX * 1.1, PX * 2.2, PX * 2.2);
      }
      const ag = c.createLinearGradient(0, -PX * 0.5, 0, PX * 0.5);
      ag.addColorStop(0, shade(col, 22)); ag.addColorStop(1, shade(col, -14));
      c.fillStyle = ag; c.strokeStyle = '#fff'; c.lineWidth = 2;
      for (let k = 0; k < n; k++) {
        const ox = (k - (n - 1) / 2) * PX * 0.42, dir = q.value === 'slow' ? -1 : 1;
        c.beginPath(); c.moveTo(ox - dir * PX * 0.25, -PX * 0.5); c.lineTo(ox + dir * PX * 0.25, 0); c.lineTo(ox - dir * PX * 0.25, PX * 0.5); c.lineTo(ox - dir * PX * 0.05, 0); c.closePath();
        c.fill(); c.stroke();
      }
      c.restore();
      return;
    }
    const y = sy(cyW), rx = PX * 0.45, rY = PX * ry;
    c.save();
    // Inner field and swirl.
    if (!lowDetail) {
      c.save(); c.beginPath(); c.ellipse(x, y, rx * 0.95, rY * 0.95, 0, 0, TAU); c.clip();
      const g = c.createRadialGradient(x, y, 0, x, y, rY);
      g.addColorStop(0, shade(col, 10, 0.5)); g.addColorStop(1, shade(col, 0, 0.05));
      c.fillStyle = g; c.fillRect(x - rx, y - rY, rx * 2, rY * 2);
      c.translate(x, y); c.scale(rx / rY, 1);
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, rY * (0.35 + k * 0.2), t * 3 + k * 2, t * 3 + k * 2 + 1.6); c.stroke(); }
      c.restore();
      c.strokeStyle = col; c.globalAlpha = 0.25; c.lineWidth = 16; c.beginPath(); c.ellipse(x, y, rx, rY, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
      // Particles drawn in.
      c.fillStyle = shade(col, 30);
      for (let k = 0; k < 6; k++) {
        const ph = (t * 0.9 + k / 6) % 1, an = k * 1.7 + t;
        const rr = 1.6 - ph * 1.4;
        c.globalAlpha = Math.sin(ph * Math.PI);
        c.fillRect(x + Math.cos(an) * rx * rr - 2, y + Math.sin(an) * rY * rr - 2, 4, 4);
      }
      c.globalAlpha = 1;
    }
    const fg = c.createLinearGradient(0, y - rY, 0, y + rY);
    fg.addColorStop(0, shade(col, 22)); fg.addColorStop(1, shade(col, -16));
    c.strokeStyle = fg; c.lineWidth = 7; c.beginPath(); c.ellipse(x, y, rx, rY, 0, 0, TAU); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, rx * 0.68, rY * 0.86, 0, 0, TAU); c.stroke();
    // Label on a dark pill.
    const ty = y - rY - PX * 0.32, tw = c.measureText(label).width + PX * 0.3, th = PX * 0.4;
    c.fillStyle = 'rgba(5,6,20,.55)';
    c.beginPath(); c.roundRect ? c.roundRect(x - tw / 2, ty - th * 0.8, tw, th, th / 2) : c.rect(x - tw / 2, ty - th * 0.8, tw, th); c.fill();
    c.fillStyle = col; c.fillText(label, x, ty);
    c.restore();
  }

  function drawParticles(c, v, list) {
    for (const q of list) {
      c.globalAlpha = Math.max(0, q.life / q.max);
      c.fillStyle = q.color;
      const s = q.size * v.PX, x = (q.x - v.camX) * v.PX, y = v.GY - (q.y - v.camY) * v.PX;
      if (q.star) {
        // Four-point sparkle.
        c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.25, y - s * 0.25); c.lineTo(x + s, y); c.lineTo(x + s * 0.25, y + s * 0.25);
        c.lineTo(x, y + s); c.lineTo(x - s * 0.25, y + s * 0.25); c.lineTo(x - s, y); c.lineTo(x - s * 0.25, y - s * 0.25); c.closePath(); c.fill();
      } else c.fillRect(x - s / 2, y - s / 2, s, s);
    }
    c.globalAlpha = 1;
  }

  // Streaks across the screen at high speed.
  function drawSpeedLines(c, v, speed, t) {
    if (speed < 12) return;
    const n = speed > 14 ? 14 : 8;
    c.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const y = hash(i, 31) * v.H, len = v.PX * (2 + hash(i, 32) * 4);
      const x = v.W - mod(t * speed * v.PX * 2.2 + hash(i, 33) * v.W * 2, v.W * 2);
      c.strokeStyle = `rgba(255,255,255,${0.06 + hash(i, 34) * 0.1})`;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
    }
  }

  function drawVignette(c, v) {
    if (!v.vig) {
      const r0 = Math.min(v.W, v.H) * 0.45, r1 = Math.hypot(v.W, v.H) * 0.62;
      v.vig = c.createRadialGradient(v.W / 2, v.H * 0.55, r0, v.W / 2, v.H * 0.55, r1);
      v.vig.addColorStop(0, 'rgba(0,0,0,0)'); v.vig.addColorStop(1, 'rgba(0,0,0,.42)');
    }
    c.fillStyle = v.vig; c.fillRect(0, 0, v.W, v.H);
  }

  root.KKRender = {
    COLORS, ICONS, PORTAL_COLORS, MODE_LABEL, ORB_COLORS, THEMES,
    drawIcon, drawForm, makeView, drawBackground, drawGround, drawLevel, drawParticles, neonLine,
    drawSpeedLines, drawVignette, themeFor, shade,
  };
})(window);
