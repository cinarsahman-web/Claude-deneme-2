KK.registerLevel({
  id: 8,
  name: 'Hız Treni',
  difficulty: 'harder',
  stars: 8,
  length: 440,
  hue: 120,
  music: { bpm: 180, root: 40, scale: 'minor', prog: [0, 3, 5, 4], drums: 'dnb', lead: 'arp', seed: 88 },
  build(b) {
    // Pillars for flying sections: a gap of `gap` blocks centred on `c`, between the floor and `ceil`.
    const pillars = new Set();
    const gate = (x, c, gap, ceil, w = 1) => {
      const lo = c - gap / 2, hi = c + gap / 2;
      if (lo > 0) b.block(x, 0, w, lo);
      if (hi < ceil) b.block(x, hi, w, ceil - hi);
      for (let i = 0; i < w; i++) pillars.add(x + i);
    };
    // Floor and ceiling spike carpets that leave the pillar cells free.
    const carpet = (x0, n, ceil) => {
      for (let x = x0; x < x0 + n; x++) {
        if (pillars.has(x)) continue;
        b.spike(x, 0);
        b.spikeDown(x, ceil - 1);
      }
    };

    // Kalkış: normal hızda ısınma
    b.spike(14);
    b.spike(22, 0, 2);
    b.block(30, 0, 2, 1); b.spike(32, 0, 2); b.block(34, 0, 2, 1);

    // Hızlı kare: geniş atlayışlar, ilk halka zinciri
    b.color(40, 150);
    b.speed(42, 'fast');
    b.spike(52, 0, 3);
    b.spike(62);
    b.block(70, 0, 3, 1); b.block(73, 0, 3, 2);
    b.spike(76, 0, 4);
    b.coin(77, 5);
    b.spike(86, 0, 12);
    b.orb(90, 2); b.orb(95, 2);

    // Çok hızlı gemi
    b.color(102, 170);
    b.mode(104, 'ship', { ceil: 9 });
    b.speed(105, 'faster');
    gate(118, 4.5, 5, 9);
    gate(128, 3, 5, 9);
    gate(138, 6, 5, 9);
    gate(148, 4, 4.5, 9);
    b.coin(152, 7);
    gate(158, 5.5, 4.5, 9);
    gate(166, 3.5, 4.5, 9);
    carpet(113, 55, 9);

    // Çok hızlı kare: pembe ve sarı halkalar
    b.color(170, 205);
    b.mode(172, 'cube');
    b.spike(184, 0, 2);
    b.spike(196, 0, 3);
    b.spike(208, 0, 10);
    b.orb(212, 2, 'pink'); b.orb(215, 2.5, 'pink');
    b.pad(224);
    b.spike(225, 0, 9);
    b.block(229, 2, 7, 1);
    b.spike(240, 0, 2);

    // Hızlı dalga
    b.color(246, 260);
    b.speed(248, 'fast');
    b.mode(250, 'wave', { ceil: 9 });
    gate(258, 3, 3, 9);
    gate(264, 6, 3, 9);
    gate(270, 3, 3, 9);
    gate(276, 6, 3, 9);
    gate(282, 4.5, 3, 9, 2);
    gate(290, 2.5, 3, 9);
    gate(296, 6.5, 3, 9);
    b.coin(279, 6.5);
    carpet(257, 43, 9);

    // Çok hızlı gemi, daha dar kapılar
    b.color(300, 300);
    b.mode(302, 'ship', { ceil: 9 });
    b.speed(303, 'faster');
    gate(314, 5, 4, 9);
    gate(323, 2.5, 4, 9);
    gate(332, 6, 4, 9);
    gate(341, 3, 4, 9);
    gate(350, 5.5, 4, 9);
    carpet(311, 43, 9);

    // Mola, sonra son çok hızlı kare koşusu
    b.color(354, 330);
    b.mode(356, 'cube');
    b.speed(357, 'normal');
    b.spike(370, 0, 2);
    b.color(378, 100);
    b.speed(380, 'faster');
    b.spike(390, 0, 3);
    b.spike(402, 0, 10);
    b.orb(406, 2); b.orb(410, 2.5, 'pink');
    b.block(416, 0, 4, 1); b.block(420, 0, 4, 2);
    b.spike(424, 0, 4);
  },
});
