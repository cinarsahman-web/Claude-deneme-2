KK.registerLevel({
  id: 10,
  name: 'Gece Yarısı',
  difficulty: 'insane',
  stars: 10,
  length: 130,
  hue: 245,
  start: { mode: 'cube', speed: 'fast', grav: 1, size: 'normal' },
  music: { bpm: 142, root: 38, scale: 'minor', prog: [0, 5, 6, 4], drums: 'half', lead: 'pluck', seed: 1010 },
  build(b) {
    // Koridor: her sütun için zemin yüksekliği, tavan = zemin + açıklık.
    const corridor = (x0, floors, gap, top) => {
      for (let i = 0; i < floors.length;) {
        let j = i;
        while (j + 1 < floors.length && floors[j + 1] === floors[i]) j++;
        const f = floors[i], w = j - i + 1;
        if (f > 0) b.block(x0 + i, 0, w, f);
        if (f + gap < top) b.block(x0 + i, f + gap, w, top - f - gap);
        i = j + 1;
      }
    };

    // 1) Giriş: hızlı küp
    b.spike(12);
    b.spike(17, 0, 2);
    b.saw(23.5, 0, 1);
    b.block(28, 0, 2, 1); b.block(30, 0, 2, 2); b.spike(32, 0, 3);
    b.block(40, 1.5, 6, 1);                             // alçak tavan: zıplama!
    b.spike(48, 0, 8); b.orb(50, 2); b.orb(54, 2);      // iki sarı küre

    // 2) Gemi: testereli sütunlar ve dar koridor
    b.color(58, 275);
    b.mode(60, 'ship', { ceil: 9 });
    b.spike(66, 0, 22);
    b.block(68, 0, 2, 4); b.saw(69, 4, 1);
    b.block(76, 5, 2, 4); b.saw(77, 5, 1);
    b.block(84, 0, 2, 4); b.saw(85, 4, 1);
    corridor(88, [2, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4], 3, 9);
    b.spike(116, 0, 10);
    b.saw(119, 6, 1.2);
    b.mode(126, 'cube');
  },
});
