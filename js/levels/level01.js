KK.registerLevel({
  id: 1,
  name: 'Neon Basamaklar',
  difficulty: 'easy',
  stars: 1,
  length: 220,
  hue: 228,
  music: { bpm: 150, root: 45, scale: 'minor', prog: [0, 5, 2, 6], drums: 'four', lead: 'arp', seed: 1 },
  build(b) {
    // Isınma
    b.spike(16);
    b.spike(26, 0, 2);
    b.spike(36, 0, 3);
    // Merdiven
    b.block(46, 0, 3, 1); b.block(49, 0, 3, 2); b.block(52, 0, 3, 3);
    b.coin(53, 5);
    b.spike(55, 0, 4);
    b.block(62, 0, 2, 1); b.spike(64, 0, 2); b.block(66, 0, 2, 1);
    b.spike(72);
    // Zıplatıcı ve asılı platform
    b.color(76, 250);
    b.pad(78);
    b.spike(79, 0, 13);
    b.block(81, 2, 7, 1);
    // Halka
    b.spike(98, 0, 6);
    b.orb(100, 2);
    // Gemi
    b.color(110, 290);
    b.mode(112, 'ship', { ceil: 9 });
    b.spike(116, 0, 50);
    b.block(122, 0, 1, 4); b.block(130, 5, 1, 4); b.block(138, 0, 1, 5);
    b.coin(134, 7);
    b.block(146, 4, 1, 5); b.block(154, 0, 1, 4); b.block(160, 5, 1, 4);
    b.mode(168, 'cube');
    // Final
    b.color(170, 320);
    b.spike(176);
    b.spike(182, 0, 3);
    b.block(189, 0, 4, 1); b.spike(193, 0, 2); b.block(195, 0, 4, 1);
    b.pad(203);
    b.spike(204, 0, 6);
    b.block(206, 2, 4, 1);
    b.coin(212, 5);
  },
});
