// Kare Koşusu: procedural music and sound effects (Web Audio).
// Each level describes its track as { bpm, root, scale, prog, drums, lead, seed }.
(function (root) {
  'use strict';

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
    lydian: [0, 2, 4, 6, 7, 9, 11],
  };
  // 16-step drum grids: k = kick, s = snare/clap, h = hat.
  const DRUMS = {
    four: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
    break: { k: 'x.....x...x.....', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.' },
    half: { k: 'x.........x.....', s: '........x.......', h: '..x...x...x...x.' },
    dnb: { k: 'x.........x.....', s: '....x.......x...', h: 'xxx.xxx.xxx.xxx.' },
    march: { k: 'x...x...x...x...', s: '..x...x...x.x.x.', h: 'x...x...x...x...' },
  };
  const MENU_TRACK = { bpm: 112, root: 43, scale: 'lydian', prog: [0, 4, 5, 3], drums: 'half', lead: 'pluck', seed: 7 };

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  const A = {
    ctx: null, master: null, musicBus: null, sfxBus: null, noise: null,
    musicVol: 0.7, sfxVol: 0.8,
    track: null, pattern: null, nextTime: 0, stepIdx: 0, playing: false, timer: null,
  };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return true; }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    A.ctx = new AC();
    A.master = A.ctx.createGain(); A.master.gain.value = 0.55; A.master.connect(A.ctx.destination);
    A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = A.musicVol; A.musicBus.connect(A.master);
    A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = A.sfxVol; A.sfxBus.connect(A.master);
    A.noise = A.ctx.createBuffer(1, A.ctx.sampleRate, A.ctx.sampleRate);
    const d = A.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.timer = setInterval(schedule, 25);
    return true;
  };

  A.setVolumes = function (music, sfx) {
    A.musicVol = music; A.sfxVol = sfx;
    if (A.musicBus) A.musicBus.gain.value = music;
    if (A.sfxBus) A.sfxBus.gain.value = sfx;
  };

  function compile(track) {
    const t = Object.assign({}, MENU_TRACK, track || {});
    const scale = SCALES[t.scale] || SCALES.minor;
    const r = rng(t.seed || 1);
    const deg = (d, oct = 0) => t.root + scale[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    // Chord tones (triad) for each bar of the progression.
    const chords = t.prog.map(d => [deg(d), deg(d + 2), deg(d + 4)]);
    // A 4-bar melody: pick chord tones / passing tones with a seeded random walk.
    const melody = [];
    let cur = 2;
    for (let bar = 0; bar < 4; bar++) {
      const row = [];
      for (let s = 0; s < 16; s++) {
        const onBeat = s % 4 === 0;
        const play = onBeat ? r() < 0.85 : r() < (t.lead === 'melody' ? 0.35 : 0.2);
        if (!play) { row.push(null); continue; }
        cur = Math.max(0, Math.min(9, cur + Math.round((r() - 0.5) * 4)));
        row.push(onBeat ? chords[bar][cur % 3] + 24 + (cur > 5 ? 12 : 0) : deg(t.prog[bar] + cur, 2));
      }
      melody.push(row);
    }
    const arp = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 1];
    return { t, chords, melody, arp, drums: DRUMS[t.drums] || DRUMS.four, s16: 60 / t.bpm / 4 };
  }

  function tone(freq, time, dur, type, gain, bus, glideTo) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, time);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, time + dur * 0.9);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g); g.connect(bus); o.start(time); o.stop(time + dur + 0.03);
  }
  function hiss(time, dur, gain, hp, bus) {
    const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noise; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(gain, time); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(time, Math.random() * 0.5); s.stop(time + dur + 0.03);
  }
  function kick(time, bus) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(160, time); o.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    g.gain.setValueAtTime(0.95, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    o.connect(g); g.connect(bus); o.start(time); o.stop(time + 0.25);
  }

  function playStep(i, time) {
    const P = A.pattern, s = i % 16, bar = Math.floor(i / 16) % 4, section = Math.floor(i / 64);
    const bus = A.musicBus, intro = i < 32;
    if (P.drums.k[s] === 'x') kick(time, bus);
    if (!intro && P.drums.s[s] === 'x') hiss(time, 0.13, 0.32, 1400, bus);
    if (P.drums.h[s] === 'x') hiss(time, 0.035, intro ? 0.08 : 0.15, 7500, bus);
    const ch = P.chords[bar];
    if (s % 2 === 0) tone(mtof(ch[0] + (s % 4 === 2 ? 12 : 0)), time, P.s16 * 1.7, 'sawtooth', 0.11, bus);
    if (intro) return;
    const lead = P.t.lead;
    if (lead === 'arp') tone(mtof(ch[P.arp[s]] + 24), time, P.s16 * 0.9, 'square', 0.04, bus);
    else if (lead === 'stabs') { if (s % 4 === 0 || s === 6 || s === 14) for (const n of ch) tone(mtof(n + 12), time, P.s16 * 1.3, 'sawtooth', 0.03, bus); }
    else if (lead === 'pluck') { if (s % 2 === 0) tone(mtof(ch[(s / 2) % 3] + 24), time, P.s16 * 2.4, 'triangle', 0.08, bus); }
    if (lead === 'melody' || section % 2 === 1) {
      const n = P.melody[bar][s];
      if (n) tone(mtof(n), time, P.s16 * 1.8, 'triangle', 0.075, bus);
    }
  }

  function schedule() {
    if (!A.ctx || !A.playing || A.ctx.state !== 'running') return;
    while (A.nextTime < A.ctx.currentTime + 0.12) {
      playStep(A.stepIdx++, A.nextTime);
      A.nextTime += A.pattern.s16;
    }
  }

  A.playTrack = function (track) {
    if (!A.ctx) return;
    A.track = track || MENU_TRACK;
    A.pattern = compile(A.track);
    A.stepIdx = 0;
    A.nextTime = A.ctx.currentTime + 0.06;
    A.playing = true;
  };
  A.playMenu = function () { A.playTrack(MENU_TRACK); };
  A.stop = function () { A.playing = false; };
  A.pause = function () { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); };
  A.resume = function () {
    if (!A.ctx) return;
    A.ctx.resume().then(() => { A.nextTime = Math.max(A.nextTime, A.ctx.currentTime + 0.05); });
  };

  A.sfx = function (kind) {
    if (!A.ctx || A.ctx.state !== 'running') return;
    const t = A.ctx.currentTime, bus = A.sfxBus;
    switch (kind) {
      case 'death': hiss(t, 0.5, 0.7, 180, bus); tone(240, t, 0.45, 'sawtooth', 0.3, bus, 40); break;
      case 'orb': tone(520, t, 0.16, 'triangle', 0.25, bus, 1250); break;
      case 'pad': tone(380, t, 0.2, 'square', 0.12, bus, 1100); break;
      case 'portal': tone(300, t, 0.32, 'sine', 0.3, bus, 900); break;
      case 'coin': [88, 93].forEach((m, i) => tone(mtof(m), t + i * 0.07, 0.25, 'square', 0.1, bus)); break;
      case 'checkpoint': tone(mtof(81), t, 0.15, 'triangle', 0.2, bus); break;
      case 'click': tone(900, t, 0.05, 'square', 0.05, bus); break;
      case 'win': [69, 73, 76, 81, 85, 88].forEach((m, i) => tone(mtof(m), t + i * 0.09, 0.42, 'square', 0.11, bus)); break;
      case 'unlock': [76, 80, 83, 88].forEach((m, i) => tone(mtof(m), t + i * 0.06, 0.3, 'triangle', 0.15, bus)); break;
    }
  };

  root.KKAudio = A;
})(window);
