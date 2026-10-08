KK.registerLevel({
  id: 11,
  name: 'Son Kare',
  difficulty: 'demon',
  stars: 12,
  length: 520,
  hue: 0,
  music: { bpm: 190, root: 39, scale: 'phrygian', prog: [0, 6, 4, 1], drums: 'dnb', lead: 'stabs', seed: 1111 },
  build(b) {
    const pillars = new Set();
    // Gap of size `gap` centred on `c` between the floor and `ceil`.
    const gate = (x, c, gap, ceil, w = 1) => {
      const lo = c - gap / 2, hi = c + gap / 2;
      if (lo > 0) b.block(x, 0, w, lo);
      if (hi < ceil) b.block(x, hi, w, ceil - hi);
      for (let i = 0; i < w; i++) pillars.add(x + i);
    };
    const carpet = (x0, n, ceil, floor = true, top = true) => {
      for (let x = x0; x < x0 + n; x++) {
        if (pillars.has(x)) continue;
        if (floor) b.spike(x, 0);
        if (top) b.spikeDown(x, ceil - 1);
      }
    };

    // 1. Giriş: kare, normal hız
    b.spike(12);
    b.spike(20, 0, 3);
    b.block(28, 0, 2, 1); b.block(30, 0, 2, 2); b.spike(32, 0, 3);
    b.block(35, 0, 2, 1);

    // 2. Hızlı kare: halka zinciri, siyah halka ve yeşil halka
    b.color(40, 15);
    b.speed(42, 'fast');
    b.spike(50, 0, 3);
    b.spike(58, 0, 12);
    b.orb(61, 2); b.orb(66, 2.5, 'pink');
    b.pad(72);
    b.block(75, 2.5, 7, 1);
    b.spike(74, 0, 8);
    b.coin(78, 5.5);
    b.spike(86, 0, 2);

    // 3. Hızlı gemi
    b.color(92, 345);
    b.mode(94, 'ship', { ceil: 9 });
    gate(104, 3.5, 4, 9);
    gate(111, 6, 4, 9);
    gate(118, 2.5, 4, 9);
    gate(125, 5.5, 3.5, 9);
    gate(132, 3, 3.5, 9);
    gate(139, 6, 3.5, 9);
    carpet(101, 42, 9);

    // 4. Top: zemin ve tavan dikenleri dönüşümlü
    b.color(144, 25);
    b.mode(146, 'ball', { ceil: 8 });
    b.spike(152, 0, 3);
    b.spikeDown(160, 7, 3);
    b.spike(167, 0, 3);
    b.spikeDown(174, 7, 4);
    b.spike(181, 0, 4);
    b.coin(186, 6);
    b.spikeDown(188, 7, 3);

    // 5. UFO, normal hız
    b.color(194, 280);
    b.speed(196, 'normal');
    b.mode(197, 'ufo', { ceil: 9 });
    gate(205, 4, 4, 9);
    gate(212, 5.5, 4, 9);
    gate(219, 3.5, 4, 9);
    gate(226, 6, 4, 9);
    gate(233, 4, 4, 9);
    carpet(203, 34, 9);

    // 6. Mini dalga, hızlı
    b.color(238, 190);
    b.speed(240, 'fast');
    b.mode(241, 'wave', { ceil: 9 });
    b.size(242, 'mini');
    gate(249, 2.5, 2.5, 9);
    gate(253, 6.5, 2.5, 9);
    gate(257, 2.5, 2.5, 9);
    gate(261, 6.5, 2.5, 9);
    gate(265, 4.5, 2.5, 9, 3);
    gate(271, 2, 2.5, 9);
    carpet(246, 28, 9);
    b.size(275, 'normal');

    // 7. Robot: testereler ve basamaklar
    b.color(276, 30);
    b.speed(277, 'normal');
    b.mode(278, 'robot');
    b.spike(287, 0, 2);
    b.saw(294, 4.2, 0.8);
    b.spike(293, 0, 2);
    b.slab(300, 0, 3); b.block(303, 0, 2, 3);
    b.spike(305, 0, 3);
    b.saw(313, 0, 1.2);
    b.miniSpike(318, 0, 3);
    b.orb(323, 1.5, 'black');
    b.block(322, 3.5, 4, 1);
    b.spike(326, 0, 3);

    // 8. Örümcek, hızlı, tavan 7
    b.color(332, 300);
    b.speed(334, 'fast');
    b.mode(335, 'spider', { ceil: 7 });
    b.spike(342, 0, 4);
    b.spikeDown(350, 6, 4);
    b.spike(357, 0, 3);
    b.block(362, 4, 3, 1);
    b.spike(365, 0, 4);
    b.spikeDown(370, 6, 3);
    b.coin(376, 2);
    b.block(375, 0, 3, 2);
    b.spike(380, 0, 3);

    // 9. Ters kare, tavan 8
    b.color(386, 220);
    b.speed(388, 'normal');
    b.mode(389, 'cube', { ceil: 8 });
    b.gravity(391, 'flip');
    b.spikeDown(398, 7, 2);
    b.spikeDown(405, 7, 3);
    b.orb(412, 5, 'blue');
    b.spikeDown(411, 7, 7);
    b.spike(419, 0, 2);
    b.gravity(423, 'normal');

    // 10. Çok hızlı gemi, dar kapılar
    b.color(424, 350);
    b.mode(426, 'ship', { ceil: 9 });
    b.speed(427, 'faster');
    gate(438, 4.5, 3.5, 9);
    gate(446, 2.5, 3.5, 9);
    gate(454, 6, 3.5, 9);
    gate(462, 3.5, 3.5, 9);
    gate(470, 5.5, 3.5, 9);
    carpet(435, 40, 9);

    // 11. Final: çok hızlı kare
    b.color(476, 0);
    b.mode(477, 'cube');
    b.spike(488, 0, 3);
    b.spike(498, 0, 12);
    b.orb(502, 2); b.orb(507, 2.5);
  },
});
