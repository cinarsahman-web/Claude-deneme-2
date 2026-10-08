// Kare Koşusu: game flow, menus, save data, input and the main loop.
(function () {
  'use strict';
  const KK = window.KK, R = window.KKRender, A = window.KKAudio;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.lang = 'tr';
  const DT = KK.DT;
  const DEFS = KK.levels.slice().sort((a, b) => a.id - b.id);
  const BUILT = new Map();
  const built = def => { if (!BUILT.has(def.id)) { const L = KK.buildLevel(def); L.ceilSegs = ceilSegments(L); BUILT.set(def.id, L); } return BUILT.get(def.id); };
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  // ---------- Save data ----------
  const SAVE_KEY = 'kare-kosusu-save-v2';
  function defaults() {
    return {
      v: 2, levels: {},
      stats: { attempts: 0, practiceAttempts: 0, jumps: 0, deaths: 0, orbs: 0, playTime: 0 },
      settings: { music: 70, sfx: 80, showPct: true, lowDetail: false, autoCp: true, shake: !reduceMotion },
      char: { icon: 0, c1: 0, c2: 1, trail: 1 },
      profile: { nick: '' },
      updatedAt: 0, resetAt: 0,
    };
  }
  function loadSave() {
    const d = defaults();
    let s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { s = null; }
    if (!s || s.v !== 2 || typeof s !== 'object') {
      s = d;
      try {
        const old = Number(localStorage.getItem('kare-kosusu-best'));
        if (old > 0) s.levels[1] = { best: Math.min(100, old), practice: 0, coins: [false, false, false], done: old >= 100, attempts: 0, jumps: 0 };
        if (localStorage.getItem('kare-kosusu-mute') === '1') { s.settings.music = 0; s.settings.sfx = 0; }
      } catch (e) { /* storage unavailable */ }
    }
    // Keep only known keys whose type matches the default, so a damaged save cannot break the game.
    const merge = (def, got) => {
      if (got && typeof got === 'object') for (const k of Object.keys(def)) if (typeof got[k] === typeof def[k]) def[k] = got[k];
      return def;
    };
    s.stats = merge(d.stats, s.stats);
    s.settings = merge(d.settings, s.settings);
    s.char = merge(d.char, s.char);
    s.profile = merge(d.profile, s.profile);
    for (const k of ['updatedAt', 'resetAt']) if (typeof s[k] !== 'number') s[k] = 0;
    if (!s.levels || typeof s.levels !== 'object') s.levels = {};
    return s;
  }
  let save = loadSave();
  function persistLocal() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* private mode */ } }
  function persist() { save.updatedAt = Date.now(); persistLocal(); cloudSchedule(); }
  function lvSave(id) {
    let l = save.levels[id];
    if (!l || typeof l !== 'object' || Array.isArray(l)) l = save.levels[id] = {};
    if (typeof l.best !== 'number') l.best = 0;
    if (typeof l.practice !== 'number') l.practice = 0;
    if (!Array.isArray(l.coins) || l.coins.length !== 3) l.coins = [false, false, false];
    if (typeof l.attempts !== 'number') l.attempts = 0;
    if (typeof l.jumps !== 'number') l.jumps = 0;
    l.done = !!l.done;
    return l;
  }
  const totalStars = () => DEFS.reduce((n, d) => n + (lvSave(d.id).done ? d.stars : 0), 0);
  const maxStars = () => DEFS.reduce((n, d) => n + d.stars, 0);
  const totalCoins = () => DEFS.reduce((n, d) => n + lvSave(d.id).coins.filter(Boolean).length, 0);
  const maxCoins = () => DEFS.length * 3;

  // ---------- Unlocks ----------
  const ICON_REQ = [null, null, { stars: 1 }, { stars: 3 }, { stars: 6 }, { stars: 10 }, { stars: 15 }, { stars: 21 }, { stars: 28 },
    { stars: 36 }, { stars: 45 }, { stars: 55 }, { stars: 67 }, { coins: 3 }, { coins: 6 }, { coins: 10 }, { coins: 16 }, { coins: 24 }, { owner: true }];
  const COLOR_REQ = [null, null, null, null, null, null, { stars: 3 }, { stars: 8 }, { stars: 14 }, { stars: 22 }, { coins: 2 }, { coins: 5 },
    { coins: 9 }, { coins: 14 }, { stars: 40 }, { coins: 20 }];
  const TRAILS = [
    { name: 'Yok', req: null }, { name: 'Kıvılcım', req: null }, { name: 'Şerit', req: { stars: 5 } },
    { name: 'Gökkuşağı', req: { coins: 12 } }, { name: 'Yıldız tozu', req: { stars: 30 } },
  ];
  // Thresholds are capped at what the installed levels can award, so every item stays reachable.
  const reqStars = req => Math.min(req.stars, maxStars());
  const reqCoins = req => Math.min(req.coins, maxCoins());
  // The artifact's owner has every character item unlocked.
  let ownerAll = false;
  const reqMet = req => !req || ownerAll || (!req.owner && (req.stars ? totalStars() >= reqStars(req) : totalCoins() >= reqCoins(req)));
  const reqText = req => req.owner ? 'Sahibe özel' : req.stars ? `${reqStars(req)}★` : `${reqCoins(req)} para`;
  function unlockedSet() {
    const s = new Set();
    ICON_REQ.forEach((r, i) => reqMet(r) && s.add('icon' + i));
    COLOR_REQ.forEach((r, i) => reqMet(r) && s.add('color' + i));
    TRAILS.forEach((t, i) => reqMet(t.req) && s.add('trail' + i));
    return s;
  }
  function unlockName(key) {
    if (key.startsWith('icon')) return `Yeni simge: ${R.ICONS[+key.slice(4)].name}`;
    if (key.startsWith('color')) return 'Yeni renk açıldı';
    return `Yeni iz: ${TRAILS[+key.slice(5)].name}`;
  }
  const charColors = () => {
    const icon = save.char.icon;
    if (R.ICONS[icon] && R.ICONS[icon].owner) {
      // The rainbow skin paints every form (ball, wave, trails) in flowing colours too.
      const h = (performance.now() / 1000 * 140) % 360;
      return { icon, c1: `hsl(${h},95%,60%)`, c2: `hsl(${(h + 150) % 360},95%,60%)` };
    }
    return { icon, c1: R.COLORS[save.char.c1] || R.COLORS[0], c2: R.COLORS[save.char.c2] || R.COLORS[1] };
  };

  // ---------- Canvas ----------
  let W = 0, H = 0, dpr = 1, view = R.makeView(800, 600);
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const v = R.makeView(W, H);
    v.camX = view.camX; v.camY = view.camY;
    view = v;
    sizePreview();
  }
  window.addEventListener('resize', resize);

  function ceilSegments(L) {
    const segs = [];
    let x0 = 0, ceil = KK.newPlayer(L).ceil;
    for (const q of L.portals) if (q.kind === 'mode') { segs.push({ x0, x1: q.x, ceil }); x0 = q.x; ceil = q.ceil; }
    segs.push({ x0, x1: L.end + 60, ceil });
    return segs;
  }

  // ---------- Toast ----------
  function toast(msg, kind) {
    const el = document.createElement('div');
    el.textContent = msg;
    if (kind) el.className = kind;
    $('toast').appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  // ---------- Screens ----------
  const SCREENS = ['scrMain', 'scrLevels', 'scrGarage', 'scrSettings', 'scrStats', 'scrAccount'];
  let screen = 'scrMain';
  function showScreen(id) {
    for (const s of SCREENS) $(s).hidden = s !== id;
    if (screen === 'scrAccount' && id !== 'scrAccount') stopBoard();
    screen = id;
    $('hud').hidden = true; $('practicePad').hidden = true; $('practiceTag').hidden = true;
    $('scrPause').hidden = true; $('scrComplete').hidden = true;
    if (id === 'scrMain') renderMain();
    if (id === 'scrLevels') renderLevels();
    if (id === 'scrGarage') renderGarage();
    if (id === 'scrSettings') renderSettings();
    if (id === 'scrStats') renderStats();
    if (id === 'scrAccount') { renderAccount(); startBoard(); }
    const first = id === 'scrLevels' ? $('lvPlay') : $(id).querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }
  function click() { A.sfx('click'); }
  function ensureAudio() {
    const first = !A.ctx;
    if (A.init()) {
      A.setVolumes(save.settings.music / 100, save.settings.sfx / 100);
      if (first && !game) A.playMenu();
    }
  }

  // Main
  function renderMain() {
    $('mCount').textContent = `${DEFS.length} bölüm · 7 mod`;
    $('mStars').textContent = `★ ${totalStars()}/${maxStars()}`;
    $('mCoins').textContent = `● ${totalCoins()}/${maxCoins()}`;
    renderAccountChip();
  }
  $('mPlay').addEventListener('click', () => { ensureAudio(); click(); showScreen('scrLevels'); });
  $('mGarage').addEventListener('click', () => { ensureAudio(); click(); showScreen('scrGarage'); });
  $('mSettings').addEventListener('click', () => { ensureAudio(); click(); showScreen('scrSettings'); });
  $('mStats').addEventListener('click', () => { ensureAudio(); click(); showScreen('scrStats'); });
  $('mAccount').addEventListener('click', () => { ensureAudio(); click(); showScreen('scrAccount'); });
  for (const id of ['lvBack', 'gBack', 'sBack', 'stBack', 'acBack']) $(id).addEventListener('click', () => { click(); showScreen('scrMain'); });

  // Level select
  let lvIndex = 0;
  try { lvIndex = Math.max(0, Math.min(DEFS.length - 1, Number(localStorage.getItem('kare-kosusu-lv')) || 0)); } catch (e) { lvIndex = 0; }
  const MECH_NAMES = { cube: 'Kare', ship: 'Gemi', ball: 'Top', ufo: 'UFO', wave: 'Dalga', robot: 'Robot', spider: 'Örümcek' };
  function mechanics(L) {
    const modes = new Set([L.start.mode]);
    let grav = false, speed = false, mini = false;
    for (const q of L.portals) {
      if (q.kind === 'mode') modes.add(q.value);
      if (q.kind === 'gravity') grav = true;
      if (q.kind === 'speed') speed = true;
      if (q.kind === 'size') mini = true;
    }
    if (L.orbs.some(o => o.type === 'blue' || o.type === 'green') || L.pads.some(p => p.type === 'blue')) grav = true;
    const out = KK.MODES.filter(m => modes.has(m)).map(m => MECH_NAMES[m]);
    if (grav) out.push('Yerçekimi');
    if (speed) out.push('Hız');
    if (mini) out.push('Mini');
    if (L.saws.length) out.push('Testere');
    return out;
  }
  function faceSVG(diff) {
    const D = KK.DIFFICULTIES[diff] || KK.DIFFICULTIES.easy, c = D.color;
    const horns = diff === 'demon' ? '<path d="M12 22 6 4 22 14Z M52 22 58 4 42 14Z" fill="#ff4060" stroke="#14101f" stroke-width="3" stroke-linejoin="round"/>' : '';
    const brows = { insane: '<path d="M17 24 28 29M47 24 36 29" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>', demon: '<path d="M16 23 29 30M48 23 35 30" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>', harder: '<path d="M18 27 28 27M36 27 46 27" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>' }[diff] || '';
    const mouth = {
      easy: '<path d="M21 42 Q32 52 43 42" fill="none" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>',
      normal: '<path d="M22 43 Q32 48 42 43" fill="none" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>',
      hard: '<path d="M23 45 L41 45" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>',
      harder: '<path d="M22 47 Q32 40 42 47" fill="none" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>',
      insane: '<path d="M21 48 Q32 38 43 48" fill="none" stroke="#14101f" stroke-width="4" stroke-linecap="round"/>',
      demon: '<path d="M19 44 L45 44 L41 51 L36 46 L32 52 L28 46 L23 51Z" fill="#fff" stroke="#14101f" stroke-width="3" stroke-linejoin="round"/>',
    }[diff] || '';
    return `<svg class="lv-face" viewBox="0 0 64 64" aria-hidden="true">${horns}<circle cx="32" cy="35" r="25" fill="${c}" stroke="#14101f" stroke-width="4"/>${brows}<circle cx="24" cy="33" r="4" fill="#14101f"/><circle cx="40" cy="33" r="4" fill="#14101f"/>${mouth}</svg>`;
  }
  function renderLevels() {
    $('lvStarsChip').textContent = `★ ${totalStars()}/${maxStars()}`;
    if (!DEFS.length) { $('lvCard').innerHTML = '<p class="note">Bölüm bulunamadı.</p>'; return; }
    const def = DEFS[lvIndex], L = built(def), ls = lvSave(def.id), D = KK.DIFFICULTIES[def.difficulty] || KK.DIFFICULTIES.easy;
    const card = $('lvCard');
    card.style.setProperty('--h', def.hue || 228);
    card.innerHTML = `
      <div class="lv-head">${faceSVG(def.difficulty)}
        <div class="lv-title"><span class="lv-num">Bölüm ${lvIndex + 1} / ${DEFS.length}</span><h3>${esc(def.name)}</h3>
          <div class="lv-meta"><span class="lv-diff" style="color:${D.color}">${D.label}</span><span class="lv-stars">${def.stars}★</span>${ls.done ? '<span style="color:var(--leaf)">Tamamlandı</span>' : ''}</div>
        </div>
      </div>
      <div class="lv-mech">${mechanics(L).map(m => `<span>${m}</span>`).join('')}</div>
      <div class="lv-bars">
        <div class="lv-bar"><span>Normal</span><div class="bar"><i style="width:${ls.best}%"></i></div><b>${ls.best}%</b></div>
        <div class="lv-bar"><span>Pratik</span><div class="bar practice"><i style="width:${ls.practice}%"></i></div><b>${ls.practice}%</b></div>
      </div>
      <div class="lv-foot">
        <div class="coin-row" aria-label="${ls.coins.filter(Boolean).length} / 3 gizli para">${ls.coins.map(c => `<i class="${c ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row"><button class="btn green" id="lvPlay">Oyna</button><button class="btn blue small" id="lvPractice">Pratik</button></div>
      </div>`;
    $('lvPlay').addEventListener('click', () => startLevel(lvIndex, false));
    $('lvPractice').addEventListener('click', () => startLevel(lvIndex, true));
    const dots = $('lvDots');
    dots.innerHTML = DEFS.map((d, i) => `<button class="${i === lvIndex ? 'on' : ''} ${lvSave(d.id).done ? 'done' : ''}" aria-label="Bölüm ${i + 1}: ${esc(d.name)}" data-i="${i}"></button>`).join('');
    $('lvPrev').disabled = false; $('lvNext').disabled = false;
    try { localStorage.setItem('kare-kosusu-lv', String(lvIndex)); } catch (e) { /* ignore */ }
  }
  function moveLevel(d) { lvIndex = (lvIndex + d + DEFS.length) % DEFS.length; click(); renderLevels(); }
  $('lvPrev').addEventListener('click', () => moveLevel(-1));
  $('lvNext').addEventListener('click', () => moveLevel(1));
  $('lvDots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { lvIndex = +b.dataset.i; click(); renderLevels(); } });
  let swipeX = null;
  $('lvCard').addEventListener('pointerdown', e => { swipeX = e.clientX; });
  $('lvCard').addEventListener('pointerup', e => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX; swipeX = null;
    if (Math.abs(dx) > 50) moveLevel(dx < 0 ? 1 : -1);
  });

  // Garage
  let gTab = 'icon';
  function renderGarage() {
    $('gStars').textContent = `★ ${totalStars()}`;
    $('gCoins').textContent = `● ${totalCoins()}`;
    for (const b of document.querySelectorAll('.tabs [role=tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === gTab));
    const grid = $('gGrid');
    grid.innerHTML = '';
    const ch = { icon: save.char.icon, c1: R.COLORS[save.char.c1] || R.COLORS[0], c2: R.COLORS[save.char.c2] || R.COLORS[1] };
    const items = gTab === 'icon' ? R.ICONS.map((ic, i) => ({ i, name: ic.name, req: ICON_REQ[i], sel: save.char.icon === i }))
      : gTab === 'trail' ? TRAILS.map((t, i) => ({ i, name: t.name, req: t.req, sel: save.char.trail === i }))
      : R.COLORS.map((c, i) => ({ i, name: `Renk ${i + 1}`, req: COLOR_REQ[i], sel: save.char[gTab] === i, color: c }));
    for (const it of items) {
      const locked = !reqMet(it.req);
      const b = document.createElement('button');
      b.className = 'cell' + (it.sel ? ' sel' : '') + (locked ? ' locked' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(it.sel));
      b.setAttribute('aria-label', it.name + (locked ? `, kilitli: ${reqText(it.req)} gerekli` : ''));
      b.title = it.name;
      if (it.color) {
        const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = it.color; b.appendChild(sw);
      } else {
        const c = document.createElement('canvas'); c.width = 128; c.height = 128; b.appendChild(c);
        const g = c.getContext('2d'); g.translate(64, 64);
        if (gTab === 'icon') R.drawIcon(g, it.i, 92, ch.c1, ch.c2);
        else drawTrailSample(g, it.i, ch);
      }
      if (locked) { const l = document.createElement('span'); l.className = 'lock'; l.textContent = reqText(it.req); b.appendChild(l); }
      b.addEventListener('click', () => {
        if (locked) { toast(`Kilitli: ${reqText(it.req)} gerekli`); return; }
        click();
        if (gTab === 'icon') save.char.icon = it.i; else if (gTab === 'trail') save.char.trail = it.i; else save.char[gTab] = it.i;
        persist(); renderGarage();
        const sel = grid.querySelector('.sel'); if (sel) sel.focus({ preventScroll: true });
      });
      grid.appendChild(b);
    }
  }
  function drawTrailSample(g, i, ch) {
    g.lineCap = 'round';
    if (i === 0) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-30, -30); g.lineTo(30, 30); g.stroke(); return; }
    for (let k = 0; k < 9; k++) {
      const x = -44 + k * 10, y = Math.sin(k * 0.8) * 14;
      if (i === 1) { g.fillStyle = k % 2 ? ch.c1 : ch.c2; g.globalAlpha = 0.3 + k / 12; g.fillRect(x - 5, y - 5, 10, 10); }
      if (i === 4) { g.fillStyle = ch.c2; g.globalAlpha = 0.3 + k / 12; g.beginPath(); g.arc(x, y + (k % 2 ? 8 : -8), 3 + k / 3, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
    if (i === 2 || i === 3) {
      g.lineWidth = 12;
      for (let k = 0; k < 8; k++) {
        g.strokeStyle = i === 3 ? `hsl(${k * 45},95%,62%)` : ch.c2;
        g.globalAlpha = 0.3 + k / 10;
        g.beginPath(); g.moveTo(-44 + k * 11, Math.sin(k * 0.8) * 14); g.lineTo(-33 + k * 11, Math.sin((k + 1) * 0.8) * 14); g.stroke();
      }
      g.globalAlpha = 1;
    }
  }
  for (const b of document.querySelectorAll('.tabs [role=tab]')) b.addEventListener('click', () => { gTab = b.dataset.tab; click(); renderGarage(); });
  const gp = $('gPreview'), gpc = gp.getContext('2d');
  function sizePreview() {
    const r = gp.getBoundingClientRect();
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w && (gp.width !== w || gp.height !== h)) { gp.width = w; gp.height = h; }
  }
  function drawGaragePreview(t) {
    sizePreview();
    const w = gp.width / dpr, h = gp.height / dpr;
    gpc.setTransform(dpr, 0, 0, dpr, 0, 0);
    gpc.clearRect(0, 0, w, h);
    const modes = KK.MODES, n = modes.length, slot = w / n, s = Math.min(slot * 0.55, h * 0.42);
    const ch = charColors();
    modes.forEach((m, i) => {
      gpc.save(); gpc.translate(slot * (i + 0.5), h * 0.45 + Math.sin(t * 3 + i) * 3);
      if (m === 'cube') gpc.rotate(Math.sin(t * 2) * 0.3);
      if (m === 'ball') gpc.rotate(t * 3);
      if (m === 'wave') gpc.rotate(-0.6);
      R.drawForm(gpc, m, s, ch, t);
      gpc.restore();
      gpc.fillStyle = 'rgba(211,220,255,.75)'; gpc.font = `600 ${Math.max(9, Math.min(12, slot / 6))}px Rubik, sans-serif`; gpc.textAlign = 'center';
      gpc.fillText(R.MODE_LABEL[m], slot * (i + 0.5), h - 10);
    });
  }

  // Settings
  function renderSettings() {
    $('setMusic').value = save.settings.music; $('setSfx').value = save.settings.sfx;
    $('setPct').checked = save.settings.showPct; $('setLow').checked = save.settings.lowDetail;
    $('setAutoCp').checked = save.settings.autoCp; $('setShake').checked = save.settings.shake;
    $('resetConfirm').hidden = true;
  }
  function bindVolume(id, key) {
    $(id).addEventListener('input', e => {
      save.settings[key] = Number(e.target.value);
      A.setVolumes(save.settings.music / 100, save.settings.sfx / 100);
      for (const other of ['setMusic', 'pMusic']) if (key === 'music') $(other).value = save.settings.music;
      for (const other of ['setSfx', 'pSfx']) if (key === 'sfx') $(other).value = save.settings.sfx;
      persist();
    });
  }
  bindVolume('setMusic', 'music'); bindVolume('setSfx', 'sfx'); bindVolume('pMusic', 'music'); bindVolume('pSfx', 'sfx');
  for (const [id, key] of [['setPct', 'showPct'], ['setLow', 'lowDetail'], ['setAutoCp', 'autoCp'], ['setShake', 'shake']]) {
    $(id).addEventListener('change', e => { save.settings[key] = e.target.checked; persist(); click(); });
  }
  $('resetBtn').addEventListener('click', () => { $('resetConfirm').hidden = false; $('resetNo').focus(); });
  $('resetNo').addEventListener('click', () => { $('resetConfirm').hidden = true; $('resetBtn').focus(); });
  $('resetYes').addEventListener('click', () => {
    const keepSettings = save.settings;
    const keepProfile = save.profile;
    save = defaults(); save.settings = keepSettings; save.profile = keepProfile; save.resetAt = Date.now(); persist();
    $('resetConfirm').hidden = true; toast('İlerleme sıfırlandı'); renderSettings();
  });

  // Stats
  function fmtTime(s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
    return h ? `${h}sa ${m}dk` : m ? `${m}dk ${sec}sn` : `${sec}sn`;
  }
  function renderStats() {
    const st = save.stats;
    const done = DEFS.filter(d => lvSave(d.id).done).length;
    const rows = [
      ['Tamamlanan bölüm', `${done}/${DEFS.length}`], ['Yıldız', `${totalStars()}/${maxStars()}`], ['Gizli para', `${totalCoins()}/${maxCoins()}`],
      ['Toplam deneme', st.attempts], ['Pratik denemesi', st.practiceAttempts], ['Zıplama', st.jumps], ['Ölüm', st.deaths],
      ['Kullanılan halka', st.orbs], ['Oynama süresi', fmtTime(st.playTime)],
    ];
    $('statsGrid').innerHTML = rows.map(([k, v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('') +
      DEFS.map(d => { const l = lvSave(d.id); return `<div class="stat"><span>${esc(d.name)}</span><strong>${l.best}%</strong><span>Pratik ${l.practice}% · ${l.coins.filter(Boolean).length}/3 para · ${l.attempts} deneme</span></div>`; }).join('');
  }


  // ---------- Account: claude.ai identity, cloud save and leaderboard ----------
  // The account is the viewer's claude.ai sign-in (no passwords). Progress lives in the viewer's
  // private db subtree; a public summary (nickname, stars, coins, icon) feeds the leaderboard.
  const Acct = { db: null, user: null, uid: null, me: null, status: 'local', note: '', writing: false, dirty: false,
    timer: null, lastSave: '', lastCard: '', board: [], unsubBoard: null, readonly: false };
  const NICK_RE = /^[\p{L}\p{N} _.\-]{2,16}$/u;
  const cleanNick = n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  const saveRef = () => Acct.db.doc('data/users/' + Acct.uid + '/save');
  const cardRef = () => Acct.db.doc('players/' + Acct.uid);
  function setStatus(status, note) { Acct.status = status; Acct.note = note || ''; renderAccountChip(); if (screen === 'scrAccount') renderAccount(); }

  function mergeCloud(c) {
    if (!c || typeof c !== 'object') return;
    const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);
    const cUpd = num(c.updatedAt), cReset = num(c.resetAt);
    if (cReset > save.updatedAt) {
      // Progress was reset on another device after this device last played: take the cloud copy.
      save.levels = {}; save.stats = defaults().stats;
    }
    if (!(save.resetAt > cUpd)) {
      const cl = c.levels && typeof c.levels === 'object' ? c.levels : {};
      for (const id of Object.keys(cl)) {
        const r = cl[id];
        if (!r || typeof r !== 'object' || !DEFS.some(d => String(d.id) === id)) continue;
        const l = lvSave(id);
        l.best = Math.max(l.best, Math.min(100, num(r.best)));
        l.practice = Math.max(l.practice, Math.min(100, num(r.practice)));
        l.attempts = Math.max(l.attempts, num(r.attempts));
        l.jumps = Math.max(l.jumps, num(r.jumps));
        l.done = l.done || !!r.done;
        if (Array.isArray(r.coins)) l.coins = l.coins.map((v, i) => v || !!r.coins[i]);
      }
      if (c.stats && typeof c.stats === 'object') for (const k of Object.keys(save.stats)) save.stats[k] = Math.max(save.stats[k], num(c.stats[k]));
    }
    // Look and settings follow whichever device changed them last.
    if (cUpd > save.updatedAt) {
      for (const k of ['char', 'settings', 'profile']) {
        const src = c[k];
        if (src && typeof src === 'object') for (const f of Object.keys(save[k])) if (typeof src[f] === typeof save[k][f]) save[k][f] = src[f];
      }
    }
    save.updatedAt = Math.max(save.updatedAt, cUpd);
    save.resetAt = Math.max(save.resetAt, cReset);
    if (save.char.icon >= R.ICONS.length) save.char.icon = 0;
    if (save.char.c1 >= R.COLORS.length) save.char.c1 = 0;
    if (save.char.c2 >= R.COLORS.length) save.char.c2 = 1;
  }

  function playerCard() {
    return {
      nick: cleanNick(save.profile.nick) || 'Oyuncu',
      stars: totalStars(), coins: totalCoins(), done: DEFS.filter(d => lvSave(d.id).done).length,
      icon: save.char.icon, c1: save.char.c1, c2: save.char.c2,
    };
  }

  async function pushCloud() {
    if (!Acct.db || Acct.readonly) return;
    if (Acct.writing) { Acct.dirty = true; return; }
    Acct.writing = true;
    try {
      const body = JSON.stringify(save);
      if (body !== Acct.lastSave) {
        setStatus('busy');
        await saveRef().set({ save: JSON.parse(body) });
        Acct.lastSave = body;
      }
      const card = playerCard(), cardStr = JSON.stringify(card);
      if (cardStr !== Acct.lastCard) {
        await cardRef().set(Object.assign({ at: Date.now() }, card));
        Acct.lastCard = cardStr;
      }
      setStatus('ok');
    } catch (e) {
      if (e && e.code === 'invalid_argument') { Acct.readonly = true; setStatus('bad', 'Bu oyunda yazma iznin yok; ilerlemen yalnızca bu cihazda saklanıyor.'); }
      else setStatus('bad', 'Buluta kaydedilemedi. Biraz sonra yeniden denenecek.');
      if (!Acct.readonly) { clearTimeout(Acct.timer); Acct.timer = setTimeout(pushCloud, 15000); }
    } finally {
      Acct.writing = false;
      if (Acct.dirty) { Acct.dirty = false; cloudSchedule(); }
    }
  }
  function flushCloud() { if (Acct.db && !Acct.readonly) { clearTimeout(Acct.timer); pushCloud(); } }
  function cloudSchedule() {
    if (!Acct.db || Acct.readonly) return;
    clearTimeout(Acct.timer);
    // While playing, deaths save every few seconds; batch them so the cloud sees one write per pause.
    Acct.timer = setTimeout(pushCloud, game && gstate !== 'paused' && gstate !== 'complete' ? 10000 : 1500);
  }

  async function initAccount() {
    const use = window.claude && typeof window.claude.use === 'function' ? window.claude.use : null;
    if (!use) { setStatus('local'); return; }
    let db = null, user = null;
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { /* unavailable */ }
    const uid = user ? await user.id() : null;
    if (!db || !user || !uid) { setStatus('local'); return; }
    Acct.db = db; Acct.user = user; Acct.uid = uid;
    Acct.me = await user.me();
    ownerAll = await user.isOwner();
    if (ownerAll && screen === 'scrGarage') renderGarage();
    setStatus('busy');
    try {
      const snap = await saveRef().get();
      if (snap.exists) {
        const before = JSON.stringify(save.levels);
        mergeCloud((snap.data() || {}).save);
        if (JSON.stringify(save.levels) !== before) toast('Bulut kaydı yüklendi', 'good');
        Acct.lastSave = JSON.stringify(save);
      }
      if (!cleanNick(save.profile.nick)) save.profile.nick = cleanNick((Acct.me.name || '').split(' ')[0]) || 'Oyuncu';
      persistLocal();
      A.setVolumes(save.settings.music / 100, save.settings.sfx / 100);
      if (!game) { if (screen === 'scrMain') renderMain(); else if (screen === 'scrLevels') renderLevels(); }
      await pushCloud();
    } catch (e) {
      setStatus('bad', 'Bulut kaydı okunamadı. İlerlemen bu cihazda saklanıyor.');
    }
  }

  function renderAccountChip() {
    const on = !!Acct.db;
    $('mNick').textContent = on ? (cleanNick(save.profile.nick) || 'Oyuncu') : 'Misafir';
    $('mAvatar').src = Acct.me ? Acct.me.avatarUrl : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><rect width="30" height="30" fill="#182060"/><circle cx="15" cy="12" r="5" fill="#8d98d6"/><path d="M6 26c1-6 17-6 18 0" fill="#8d98d6"/></svg>');
    $('mSyncDot').className = on && Acct.status === 'ok' ? 'on' : '';
  }

  function renderAccount() {
    const on = !!Acct.db;
    $('acAvatar').src = $('mAvatar').src;
    $('acNick').textContent = on ? (cleanNick(save.profile.nick) || 'Oyuncu') : 'Misafir';
    $('acWho').textContent = on ? (Acct.me && Acct.me.name ? `claude.ai: ${Acct.me.name}` : 'claude.ai hesabı') : 'claude.ai hesabı bağlı değil';
    $('acForm').hidden = !on || Acct.readonly;
    $('acOffline').hidden = on;
    $('acOwner').hidden = !ownerAll;
    if (on && document.activeElement !== $('acNickInput')) $('acNickInput').value = cleanNick(save.profile.nick);
    const dot = { ok: 'ok', busy: 'busy', bad: 'bad' }[Acct.status] || '';
    $('acDot').className = dot;
    $('acStatus').textContent = Acct.note || ({ ok: 'Bulutla eşitlendi', busy: 'Eşitleniyor…', local: 'İlerleme bu cihazda saklanıyor' }[Acct.status] || 'İlerleme bu cihazda saklanıyor');
    $('acBoardTitle').hidden = !on; $('acBoard').hidden = !on || !Acct.board.length; $('acBoardEmpty').hidden = !on || Acct.board.length > 0;
  }
  $('acFill').addEventListener('click', () => {
    if (!ownerAll) return;
    for (const d of DEFS) { const l = lvSave(d.id); l.best = 100; l.practice = 100; l.done = true; l.coins = [true, true, true]; }
    persist(); flushCloud(); A.sfx('unlock');
    toast('Bütün bölümler, paralar ve yıldızlar tamamlandı', 'good');
    renderAccount(); renderAccountChip();
  });
  $('acForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = cleanNick($('acNickInput').value);
    if (!NICK_RE.test(n)) { toast('Ad 2-16 harf, rakam, boşluk, nokta, alt çizgi ya da tire olmalı'); return; }
    save.profile.nick = n; persist(); click();
    clearTimeout(Acct.timer); pushCloud();
    toast('Ad kaydedildi', 'good'); renderAccount(); renderAccountChip();
  });

  function startBoard() {
    if (!Acct.db || Acct.unsubBoard) return;
    Acct.unsubBoard = Acct.db.collection('players').orderBy('stars', 'desc').limit(100).onSnapshot(snap => {
      Acct.board = snap.docs.map(d => ({ id: d.id, data: d.data() || {} }));
      renderBoard();
    }, () => { Acct.unsubBoard = null; });
  }
  function stopBoard() { if (Acct.unsubBoard) { Acct.unsubBoard(); Acct.unsubBoard = null; } }

  async function renderBoard() {
    const n = v => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
    const rows = Acct.board.map(r => ({
      id: r.id, nick: cleanNick(r.data.nick) || 'Oyuncu', stars: Math.min(n(r.data.stars), maxStars()), coins: Math.min(n(r.data.coins), maxCoins()),
      done: n(r.data.done), icon: n(r.data.icon) % R.ICONS.length, c1: n(r.data.c1) % R.COLORS.length, c2: n(r.data.c2) % R.COLORS.length,
    })).sort((a, b) => b.stars - a.stars || b.coins - a.coins || b.done - a.done);
    const ps = Acct.user ? await Acct.user.profiles(rows.map(r => r.id)) : {};
    const list = $('acBoard');
    list.textContent = '';
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      if (r.id === Acct.uid) li.className = 'me';
      const rank = document.createElement('span'); rank.className = 'rank'; rank.textContent = i + 1;
      const c = document.createElement('canvas'); c.width = 80; c.height = 80;
      const g = c.getContext('2d'); g.translate(40, 40); R.drawIcon(g, r.icon, 60, R.COLORS[r.c1], R.COLORS[r.c2]);
      const who = document.createElement('div'); who.className = 'who';
      const nm = document.createElement('b'); nm.textContent = r.nick + (r.id === Acct.uid ? ' (sen)' : '');
      const sm = document.createElement('small');
      const p = ps[r.id];
      if (p) { const im = document.createElement('img'); im.src = p.avatarUrl; im.alt = ''; sm.appendChild(im); }
      const sp = document.createElement('span'); sp.textContent = (p && p.name) ? p.name : `${r.done} bölüm`; sm.appendChild(sp);
      who.append(nm, sm);
      const sc = document.createElement('div'); sc.className = 'score';
      const st = document.createElement('b'); st.textContent = r.stars + '★';
      const co = document.createElement('span'); co.textContent = r.coins + ' para';
      sc.append(st, co);
      li.append(rank, c, who, sc);
      list.appendChild(li);
    });
    if (screen === 'scrAccount') renderAccount();
  }

  // ---------- Input ----------
  const keys = new Set();
  const pointers = new Set();
  const holding = () => keys.size > 0 || pointers.size > 0;
  const releaseAll = () => { keys.clear(); pointers.clear(); };
  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
  window.addEventListener('keydown', e => {
    if (e.repeat && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) e.preventDefault();
    if (game && (gstate === 'play' || gstate === 'dead')) {
      if (JUMP_KEYS.has(e.code)) { e.preventDefault(); keys.add(e.code); return; }
      if (e.code === 'KeyZ' && game.practice && !e.repeat) { addCheckpoint(true); return; }
      if (e.code === 'KeyX' && game.practice && !e.repeat) { removeCheckpoint(); return; }
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
      if (game && (gstate === 'play' || gstate === 'dead')) { e.preventDefault(); pauseGame(); return; }
      if (game && gstate === 'paused') { e.preventDefault(); resumeGame(); return; }
      if (!game && e.code === 'Escape' && screen !== 'scrMain') { e.preventDefault(); showScreen('scrMain'); return; }
    }
    if (!game && screen === 'scrLevels' && !e.repeat) {
      if (e.code === 'ArrowLeft') { moveLevel(-1); e.preventDefault(); }
      else if (e.code === 'ArrowRight') { moveLevel(1); e.preventDefault(); }
      else if (e.code === 'Enter' && (document.activeElement === document.body || document.activeElement === cv)) { startLevel(lvIndex, false); e.preventDefault(); }
    }
    if (!game && screen === 'scrMain' && JUMP_KEYS.has(e.code) && e.code !== 'Space' && !e.repeat) { ensureAudio(); showScreen('scrLevels'); }
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  cv.addEventListener('pointerdown', e => {
    if (game && (gstate === 'play' || gstate === 'dead')) { e.preventDefault(); pointers.add(e.pointerId); }
  });
  window.addEventListener('pointerup', e => pointers.delete(e.pointerId));
  window.addEventListener('pointercancel', e => pointers.delete(e.pointerId));
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (game && (gstate === 'play' || gstate === 'dead')) pauseGame();
    persist(); flushCloud();
  });
  window.addEventListener('pagehide', () => { persist(); flushCloud(); });

  // ---------- Game ----------
  let game = null, gstate = 'idle', acc = 0, auto = null;
  let particles = [], rings = [];
  const EMPTY_LEVEL = { blocks: [], spikes: [], saws: [], pads: [], orbs: [], portals: [], coins: [], colors: [], ceilSegs: [], end: 1e9, maxBlockW: 1, maxSawR: 0 };

  function startLevel(idx, practice) {
    ensureAudio();
    lvIndex = idx;
    const def = DEFS[idx], L = built(def);
    game = {
      idx, def, L, practice, attempt: 0, jumps: 0, runTime: 0, checkpoints: [], cpTimer: 0, lastCpX: -99,
      p: null, rot: 0, deadT: 0, trail: [], ribbon: [], shake: 0, hue: def.hue || 228, groundHue: def.hue || 228, flash: 0,
    };
    for (const s of SCREENS) $(s).hidden = true;
    $('scrComplete').hidden = true; $('scrPause').hidden = true;
    $('hud').hidden = false;
    setPracticeUI();
    A.playTrack(def.music);
    respawn(true);
    cv.focus({ preventScroll: true });
  }
  function setPracticeUI() {
    $('practicePad').hidden = !game.practice; $('practiceTag').hidden = !game.practice;
    $('hudBar').classList.toggle('practice', game.practice);
  }
  function hueAt(L, x, def) {
    let h = def.hue || 228, gh = h;
    for (const c of L.colors) { if (c.x > x) break; h = c.hue; gh = c.ground; }
    return [h, gh];
  }
  function respawn(fresh) {
    const g = game, L = g.L, ls = lvSave(g.def.id);
    const cp = g.practice && !fresh && g.checkpoints.length ? g.checkpoints[g.checkpoints.length - 1] : null;
    if (cp) { g.p = KK.clonePlayer(cp.p); g.rot = cp.rot; g.lastCpX = cp.p.x; }
    else {
      g.p = KK.newPlayer(L); g.rot = 0; g.runTime = 0;
      if (fresh || !g.practice) { g.checkpoints = []; g.lastCpX = -99; }
      if (!g.practice) A.playTrack(g.def.music);
    }
    g.p.holdPrev = holding(); g.p.jumpBuf = 0;
    g.attempt++;
    if (g.practice) save.stats.practiceAttempts++;
    else { save.stats.attempts++; ls.attempts++; }
    persist();
    g.cpTimer = 0; g.trail = []; g.ribbon = []; particles = []; rings = [];
    if (auto) auto.i = 0;
    acc = 0; gstate = 'play';
    [g.hue, g.groundHue] = hueAt(L, g.p.x, g.def);
    snapCamera();
  }
  function snapCamera() {
    const p = game.p;
    view.camX = Math.min(p.x, game.L.end) - (W * 0.3) / view.PX;
    view.camY = cameraTargetY(p);
  }
  function cameraTargetY(p) {
    const visH = view.visH;
    if (isFinite(p.ceil)) return Math.max(0, p.ceil - visH + 0.6);
    return Math.max(0, p.y + p.size - (visH - 3.5));
  }
  function burst(x, y, color, n, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.9);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, size: 0.12 + Math.random() * 0.22, color });
    }
  }
  function handleEvents(ev) {
    const p = game.p, ch = charColors();
    for (const e of ev) {
      if (e.type === 'jump') { game.jumps++; save.stats.jumps++; }
      else if (e.type === 'orb') {
        save.stats.orbs++; A.sfx('orb');
        rings.push({ x: e.orb.x + 0.5, y: e.orb.y + 0.5, r: 0.3, life: 0.35, color: R.ORB_COLORS[e.orb.type] });
      } else if (e.type === 'pad') {
        A.sfx('pad');
        rings.push({ x: e.pad.x + 0.5, y: e.pad.down ? e.pad.y + 0.85 : e.pad.y + 0.15, r: 0.3, life: 0.35, color: R.ORB_COLORS[e.pad.type] });
      } else if (e.type === 'portal') {
        A.sfx('portal');
        burst(p.x + p.size / 2, p.y + p.size / 2, e.kind === 'mode' ? R.PORTAL_COLORS[e.value] : '#ffffff', 16, 6, 0.45);
        if (e.kind === 'mode') { game.trail = []; game.rot = 0; }
      } else if (e.type === 'coin') {
        A.sfx('coin'); burst(e.coin.x + 0.5, e.coin.y + 0.5, '#f5c542', 18, 7, 0.6);
        toast(`Gizli para ${e.coin.idx + 1}/3`, 'good');
      } else if (e.type === 'spider') {
        for (let k = 0; k < 8; k++) particles.push({ x: p.x + p.size / 2, y: e.fromY + (e.toY - e.fromY) * k / 8 + p.size / 2, vx: -1, vy: 0, life: 0.3, max: 0.3, size: 0.25, color: ch.c2 });
      }
    }
  }
  // A checkpoint is safe when a player who respawns there with the button released survives
  // either by doing nothing, or by starting to hold only after a quarter-second reaction time.
  function survives(p0, L) {
    for (const hold of [false, true]) {
      const q = KK.clonePlayer(p0);
      q.holdPrev = false; q.jumpBuf = 0;
      let ok = true;
      for (let i = 0; i < 200; i++) { KK.step(q, L, DT, hold && i >= 60); if (q.dead) { ok = false; break; } if (q.won) break; }
      if (ok) return true;
    }
    return false;
  }
  function addCheckpoint(manual) {
    const g = game, p = g.p;
    if (!g.practice || gstate !== 'play' || p.dead) return;
    if (!manual && !survives(p, g.L)) return;
    g.checkpoints.push({ p: KK.clonePlayer(p), rot: g.rot });
    g.lastCpX = p.x; g.cpTimer = 0;
    if (manual) A.sfx('checkpoint');
  }
  function removeCheckpoint() {
    if (!game || !game.practice || !game.checkpoints.length) return;
    game.checkpoints.pop(); A.sfx('click');
    const lastCp = game.checkpoints[game.checkpoints.length - 1];
    game.lastCpX = lastCp ? lastCp.p.x : -99;
  }
  $('cpAdd').addEventListener('pointerdown', e => e.stopPropagation());
  $('cpDel').addEventListener('pointerdown', e => e.stopPropagation());
  $('cpAdd').addEventListener('click', e => { e.currentTarget.blur(); addCheckpoint(true); });
  $('cpDel').addEventListener('click', e => { e.currentTarget.blur(); removeCheckpoint(); });

  function die() {
    const g = game, ls = lvSave(g.def.id), p = g.p;
    gstate = 'dead'; g.deadT = g.practice ? 0.65 : 1.0;
    save.stats.deaths++;
    if (save.settings.shake) g.shake = 0.6;
    const ch = charColors();
    burst(p.x + p.size / 2, p.y + p.size / 2, ch.c1, 26, 9, 0.8);
    burst(p.x + p.size / 2, p.y + p.size / 2, ch.c2, 14, 6, 0.7);
    rings.push({ x: p.x + p.size / 2, y: p.y + p.size / 2, r: 0.4, life: 0.5, color: '#ffffff' });
    A.sfx('death');
    const pct = pctOf(p);
    if (g.practice) { if (pct > ls.practice) ls.practice = pct; }
    else if (pct > ls.best) {
      const first = ls.best === 0;
      ls.best = pct;
      if (!first || pct >= 10) toast(`Yeni rekor! %${pct}`);
    }
    persist();
  }
  const pctOf = p => Math.max(0, Math.min(100, Math.floor(p.x / game.L.end * 100)));

  function complete() {
    const g = game, ls = lvSave(g.def.id), p = g.p;
    gstate = 'complete';
    const before = unlockedSet();
    let earned = '';
    const newCoins = [];
    if (g.practice) {
      ls.practice = 100;
    } else {
      if (!ls.done) earned = `+${g.def.stars}★`;
      ls.done = true; ls.best = 100;
      for (const idx of p.coins) { if (!ls.coins[idx]) newCoins.push(idx); ls.coins[idx] = true; }
    }
    persist();
    const after = unlockedSet();
    const unlocked = [...after].filter(k => !before.has(k));
    A.sfx('win');
    for (let i = 0; i < 6; i++) burst(p.x + 0.5, p.y + 1 + i * 0.6, ['#ffd23f', '#56f0ff', '#ff3d9a', '#5dff9d'][i % 4], 16, 10, 1.4);
    g.flash = 1;
    setTimeout(() => {
      if (!game || gstate !== 'complete') return;
      $('cSub').textContent = g.practice ? 'Pratik modu' : g.def.name;
      $('cTitle').textContent = g.practice ? 'Pratik tamamlandı!' : 'Bölüm tamamlandı!';
      $('cEarned').textContent = g.practice ? 'Şimdi normal modda dene' : earned || 'Zaten tamamlanmıştı';
      const coinEls = $('cCoins').children;
      for (let i = 0; i < 3; i++) coinEls[i].className = (g.practice ? p.coins.has(i) : ls.coins[i]) ? 'on' : '';
      $('cAtt').textContent = g.attempt;
      $('cJumps').textContent = g.jumps;
      $('cTime').textContent = g.runTime.toFixed(1) + 's';
      $('cUnlocks').innerHTML = [
        ...newCoins.map(i => `<div>Gizli para ${i + 1} kaydedildi</div>`),
        ...unlocked.map(k => `<div>${esc(unlockName(k))}</div>`),
      ].join('');
      if (unlocked.length) A.sfx('unlock');
      const hasNext = g.idx < DEFS.length - 1;
      $('cNext').hidden = !hasNext;
      $('scrComplete').hidden = false;
      $('hud').hidden = true; $('practicePad').hidden = true; $('practiceTag').hidden = true;
      (hasNext ? $('cNext') : $('cAgain')).focus({ preventScroll: true });
    }, 1100);
  }
  $('cNext').addEventListener('click', () => { click(); startLevel(Math.min(DEFS.length - 1, game.idx + 1), false); });
  $('cAgain').addEventListener('click', () => { click(); startLevel(game.idx, game.practice); });
  $('cLevels').addEventListener('click', () => { click(); exitToLevels(); });

  let pausedFrom = 'play';
  function pauseGame() {
    if (!game || (gstate !== 'play' && gstate !== 'dead')) return;
    pausedFrom = gstate;
    gstate = 'paused'; releaseAll();
    persist();
    const ls = lvSave(game.def.id);
    $('pLevel').textContent = game.def.name;
    $('pBarN').style.width = ls.best + '%'; $('pPctN').textContent = ls.best + '%';
    $('pBarP').style.width = ls.practice + '%'; $('pPctP').textContent = ls.practice + '%';
    $('pAtt').textContent = game.attempt; $('pNow').textContent = pctOf(game.p) + '%';
    $('pPractice').textContent = game.practice ? 'Normal moda geç' : 'Pratik modu';
    $('pMusic').value = save.settings.music; $('pSfx').value = save.settings.sfx;
    $('scrPause').hidden = false; $('pResume').focus({ preventScroll: true });
    A.pause();
  }
  function resumeGame() {
    if (!game || gstate !== 'paused') return;
    $('scrPause').hidden = true; gstate = pausedFrom; last = performance.now();
    A.resume();
    cv.focus({ preventScroll: true });
  }
  $('pauseBtn').addEventListener('pointerdown', e => e.stopPropagation());
  $('pauseBtn').addEventListener('click', e => { e.currentTarget.blur(); pauseGame(); });
  $('pResume').addEventListener('click', resumeGame);
  $('pRestart').addEventListener('click', () => {
    A.resume(); click(); $('scrPause').hidden = true;
    game.checkpoints = []; respawn(true); A.playTrack(game.def.music);
  });
  $('pPractice').addEventListener('click', () => {
    A.resume(); click(); $('scrPause').hidden = true;
    game.practice = !game.practice;
    setPracticeUI();
    if (game.practice) {
      game.checkpoints = [];
      gstate = 'play'; last = performance.now();
      addCheckpoint(false);
      toast('Pratik modu açık', 'good');
    } else {
      respawn(true); A.playTrack(game.def.music);
    }
  });
  $('pExit').addEventListener('click', () => { A.resume(); click(); exitToLevels(); });
  function exitToLevels() {
    persist();
    game = null; gstate = 'idle';
    particles = []; rings = [];
    A.playMenu();
    showScreen('scrLevels');
  }

  // ---------- Update ----------
  let clock = 0, last = performance.now();
  function lerpHue(a, b, k) { const d = ((b - a + 540) % 360) - 180; return a + d * k; }

  function updateGame(dt) {
    const g = game, L = g.L;
    if (gstate === 'play') {
      acc += dt; g.runTime += dt; save.stats.playTime += dt;
      while (acc >= DT) {
        acc -= DT;
        const ev = [];
        const prevMode = g.p.mode;
        const input = auto ? !!auto.actions[Math.floor(auto.i++ / auto.K)] : holding();
        KK.step(g.p, L, DT, input, ev);
        if (ev.length) handleEvents(ev);
        if (g.p.dead) { die(); break; }
        if (g.p.won) { complete(); break; }
        if (g.practice && save.settings.autoCp) {
          g.cpTimer += DT;
          const p = g.p, onSurface = p.grounded || p.mode === 'ship' || p.mode === 'ufo' || p.mode === 'wave';
          if (g.cpTimer >= 2.5 && onSurface && p.x - g.lastCpX > 8) addCheckpoint(false);
        }
        if (g.p.mode === 'wave' && prevMode === 'wave') {
          g.trail.push([g.p.x + g.p.size / 2, g.p.y + g.p.size / 2]);
          if (g.trail.length > 400) g.trail.shift();
        }
      }
      updateRotation(dt);
      updateTrail(dt);
    } else if (gstate === 'dead') {
      g.deadT -= dt;
      if (g.deadT <= 0) respawn(false);
    }
    // Camera.
    const p = g.p;
    const tx = Math.min(p.x, L.end) - (W * 0.3) / view.PX;
    view.camX += (tx - view.camX) * Math.min(1, dt * 20);
    view.camY += (cameraTargetY(p) - view.camY) * Math.min(1, dt * 5);
    // Colours.
    const [th, tg] = hueAt(L, p.x, g.def);
    g.hue = lerpHue(g.hue, th, Math.min(1, dt * 2.5));
    g.groundHue = lerpHue(g.groundHue, tg, Math.min(1, dt * 2.5));
    g.shake = Math.max(0, g.shake - dt * 2.5);
    g.flash = Math.max(0, g.flash - dt * 1.5);
    // HUD.
    const pc = gstate === 'complete' ? 100 : pctOf(p);
    $('barFill').style.width = pc + '%';
    $('pct').textContent = pc + '%';
    $('pct').hidden = !save.settings.showPct;
    const coinEls = $('hudCoins').children;
    for (let i = 0; i < 3; i++) coinEls[i].className = p.coins.has(i) ? 'on' : '';
  }

  function updateRotation(dt) {
    const g = game, p = g.p;
    if (p.mode === 'cube') {
      if (p.grounded) {
        const target = Math.round(g.rot / (Math.PI / 2)) * (Math.PI / 2);
        g.rot += (target - g.rot) * Math.min(1, dt * 22);
      } else g.rot += dt * (p.size < 1 ? 9 : 7.3) * p.grav;
    } else if (p.mode === 'ball') {
      g.rot += dt * p.speed / (0.5 * p.size) * p.grav;
    } else if (p.mode === 'ship' || p.mode === 'wave') {
      g.rot = -Math.atan2(p.vy, p.speed) * (p.mode === 'ship' ? 1.1 : 1);
    } else if (p.mode === 'ufo') {
      g.rot = -Math.atan2(p.vy, p.speed) * 0.35;
    } else g.rot = 0;
  }

  function updateTrail(dt) {
    const g = game, p = g.p, ch = charColors(), kind = save.char.trail;
    const cx = p.x + p.size / 2, cy = p.y + p.size / 2;
    if (kind === 1 && Math.random() < 0.6) particles.push({ x: cx - p.size * 0.4, y: cy + (Math.random() - 0.5) * 0.4 * p.size, vx: -1.5, vy: (Math.random() - 0.5), life: 0.3, max: 0.3, size: 0.12 + Math.random() * 0.1, color: Math.random() < 0.5 ? ch.c1 : ch.c2 });
    if (kind === 4 && Math.random() < 0.5) particles.push({ x: cx - p.size * 0.3, y: cy + (Math.random() - 0.5) * 0.8 * p.size, vx: -0.5, vy: 0.5, life: 0.6, max: 0.6, size: 0.08 + Math.random() * 0.08, color: Math.random() < 0.3 ? '#ffffff' : ch.c2 });
    if (p.mode === 'ship' && Math.random() < 0.6) particles.push({ x: p.x + 0.05, y: cy - 0.1 * p.grav, vx: -2 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.5, life: 0.35, max: 0.35, size: 0.16, color: ch.c2 });
    if (kind === 2 || kind === 3) {
      g.ribbon.push([cx, cy]);
      if (g.ribbon.length > 22) g.ribbon.shift();
    }
  }

  function updateFx(dt) {
    for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 9 * dt; q.life -= dt; }
    if (particles.length) particles = particles.filter(q => q.life > 0);
    for (const r of rings) { r.r += dt * 6; r.life -= dt; }
    if (rings.length) rings = rings.filter(r => r.life > 0);
  }

  // ---------- Menu background demo ----------
  const demoDef = {
    id: 0, length: 1e7, start: {},
    build(b) {
      let x = 18;
      for (let i = 0; i < 400; i++) {
        const k = i % 7;
        if (k === 3) { b.block(x, 0, 3, 1); x += 3 + 8; }
        else { b.spike(x, 0, 1 + (k % 2)); x += 10 + (k * 3) % 5; }
      }
    },
  };
  const demoL = KK.buildLevel(demoDef); demoL.ceilSegs = [];
  let demo = { p: KK.newPlayer(demoL), rot: 0, hue: 228 };
  function demoHold(p) {
    const L = demoL;
    if (!p.grounded) return false;
    const i = KK.lowerBound(L.spikes, p.x);
    const s = L.spikes[i];
    if (s && s.x - (p.x + 1) < 1.0) return true;
    const j = KK.lowerBound(L.blocks, p.x + 0.5);
    const b = L.blocks[j];
    if (b && b.x - (p.x + 1) < 1.4 && b.x - (p.x + 1) > 0) return true;
    return false;
  }
  function updateDemo(dt) {
    let n = Math.min(40, Math.round(dt / DT));
    while (n-- > 0) {
      KK.step(demo.p, demoL, DT, demoHold(demo.p));
      if (demo.p.dead || demo.p.x > 3500) { demo.p = KK.newPlayer(demoL); view.camX = -4; }
    }
    const p = demo.p;
    if (p.grounded) { const t = Math.round(demo.rot / (Math.PI / 2)) * (Math.PI / 2); demo.rot += (t - demo.rot) * Math.min(1, dt * 22); }
    else demo.rot += dt * 7.3;
    view.camX += ((p.x - (W * 0.3) / view.PX) - view.camX) * Math.min(1, dt * 20);
    view.camY += (0 - view.camY) * Math.min(1, dt * 5);
    demo.hue = 228 + 40 * Math.sin(clock * 0.07);
  }

  // ---------- Draw ----------
  function drawPlayer(p, rot, t, alpha) {
    const s = p.size * view.PX, ch = charColors();
    const cx = (p.x + p.size / 2 - view.camX) * view.PX, cy = view.GY - (p.y + p.size / 2 - view.camY) * view.PX;
    ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = alpha;
    ctx.rotate(rot);
    if (p.grav < 0 && p.mode !== 'cube' && p.mode !== 'ball' && p.mode !== 'wave') ctx.scale(1, -1);
    R.drawForm(ctx, p.mode, s, ch, t);
    ctx.restore();
  }
  function drawTrails() {
    const g = game, ch = charColors(), PX = view.PX;
    const toS = ([x, y]) => [(x - view.camX) * PX, view.GY - (y - view.camY) * PX];
    if (g.p.mode === 'wave' && g.trail.length > 1) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (!save.settings.lowDetail) {
        ctx.strokeStyle = ch.c1; ctx.globalAlpha = 0.25; ctx.lineWidth = PX * 0.5 * g.p.size;
        ctx.beginPath(); g.trail.forEach((pt, i) => { const [x, y] = toS(pt); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = ch.c1; ctx.lineWidth = PX * 0.18 * g.p.size;
      ctx.beginPath(); g.trail.forEach((pt, i) => { const [x, y] = toS(pt); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = PX * 0.06 * g.p.size; ctx.stroke();
    }
    const kind = save.char.trail;
    if ((kind === 2 || kind === 3) && g.ribbon.length > 1 && gstate !== 'dead') {
      ctx.lineCap = 'round';
      for (let i = 1; i < g.ribbon.length; i++) {
        const [x0, y0] = toS(g.ribbon[i - 1]), [x1, y1] = toS(g.ribbon[i]);
        ctx.strokeStyle = kind === 3 ? `hsl(${(clock * 200 + i * 25) % 360},95%,62%)` : ch.c2;
        ctx.globalAlpha = i / g.ribbon.length * 0.8;
        ctx.lineWidth = PX * 0.32 * g.p.size * i / g.ribbon.length;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const low = save.settings.lowDetail;
    if (game) {
      const g = game, L = g.L;
      R.drawBackground(ctx, view, g.hue, g.groundHue, t, low);
      ctx.save();
      if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake * 16, (Math.random() - 0.5) * g.shake * 16);
      // Attempt label sits in the world near the start, like a sign.
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.textAlign = 'left';
      ctx.font = `${Math.round(view.PX * 0.75)}px Bungee, Impact, sans-serif`;
      const label = g.practice ? 'Pratik' : `Deneme ${g.attempt}`;
      const lx = g.practice && g.checkpoints.length ? null : 3;
      if (lx !== null) ctx.fillText(label, (lx - view.camX) * view.PX, view.GY - (4.6 - view.camY) * view.PX);
      R.drawGround(ctx, view, g.hue, g.groundHue, L, low);
      R.drawLevel(ctx, L, view, g.p, t, g.hue, low);
      // Checkpoints.
      for (const cp of g.checkpoints) {
        const x = (cp.p.x + cp.p.size / 2 - view.camX) * view.PX, y = view.GY - (cp.p.y + cp.p.size / 2 - view.camY) * view.PX;
        if (x < -20 || x > W + 20) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
        ctx.fillStyle = 'rgba(93,255,157,.35)'; ctx.strokeStyle = '#5dff9d'; ctx.lineWidth = 2;
        ctx.fillRect(-view.PX * 0.2, -view.PX * 0.2, view.PX * 0.4, view.PX * 0.4); ctx.strokeRect(-view.PX * 0.2, -view.PX * 0.2, view.PX * 0.4, view.PX * 0.4);
        ctx.restore();
      }
      drawTrails();
      for (const r of rings) {
        ctx.strokeStyle = r.color || '#fff'; ctx.globalAlpha = Math.min(1, r.life * 2.5); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc((r.x - view.camX) * view.PX, view.GY - (r.y - view.camY) * view.PX, r.r * view.PX, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (gstate !== 'dead' && !(gstate === 'complete' && g.flash < 0.6)) drawPlayer(g.p, g.rot, t, 1);
      R.drawParticles(ctx, view, particles);
      ctx.restore();
      if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    } else {
      R.drawBackground(ctx, view, demo.hue, demo.hue, t, low);
      R.drawGround(ctx, view, demo.hue, demo.hue, demoL, low);
      R.drawLevel(ctx, demoL, view, null, t, demo.hue, low);
      drawPlayer(demo.p, demo.rot, t, 1);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;
    if (game) { if (gstate !== 'paused') updateGame(dt); }
    else updateDemo(dt);
    updateFx(dt);
    draw(clock);
    if (!game && screen === 'scrGarage') drawGaragePreview(clock);
    requestAnimationFrame(frame);
  }

  // ---------- Boot ----------
  resize();
  showScreen('scrMain');
  initAccount();
  // Expose a small handle for automated tests.
  window.__kk = {
    get state() { return gstate; }, get screen() { return screen; }, get game() { return game; }, get save() { return save; },
    startLevel, defs: DEFS, autoplay(actions, K) { auto = actions ? { actions, K, i: 0 } : null; },
  };
  requestAnimationFrame(frame);
})();
