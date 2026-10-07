KK.registerLevel({
  id: 9,
  name: 'Kaos Teorisi',
  difficulty: 'insane',
  stars: 9,
  length: 440,
  hue: 340,
  music: { bpm: 174, root: 38, scale: 'harmonic', prog: [0, 5, 3, 4], drums: 'break', lead: 'melody', seed: 909 },
  build(b) {
    // 1) Küp: ısınma + sarı küre
    b.spike(10);
    b.spike(14, 0, 2);
    b.block(19, 0, 2, 1); b.spike(21, 0, 7); b.orb(23, 3, 'yellow');

    // 2) Gemi
    b.color(30, 300);
    b.mode(32, 'ship', { ceil: 8 });
    b.spike(37, 0, 20);
    b.block(40, 0, 2, 3);
    b.block(45, 5, 2, 3);
    b.block(50, 0, 2, 3); b.block(50, 6, 2, 2);

    // 3) Top
    b.mode(57, 'ball', { ceil: 6 });
    b.spike(66, 0, 3);
    b.spikeDown(72, 5, 3);
    b.spike(78, 0, 3);

    // 4) UFO
    b.mode(86, 'ufo', { ceil: 8 });
    b.spike(92, 0, 20);
    b.block(95, 0, 2, 2);
    b.block(100, 4, 2, 4);
    b.block(104, 0, 2, 3);
    b.block(109, 0, 1, 2); b.block(109, 5, 1, 3);
  },
});
