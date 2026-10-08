KK.registerLevel({
  id: 3,
  name: 'Uçan Daire',
  difficulty: 'normal',
  stars: 3,
  length: 330,
  hue: 160,
  music: { bpm: 128, root: 43, scale: 'dorian', prog: [0, 3, 6, 4], drums: 'half', lead: 'melody', seed: 33 },
  build(b) {
    // 1) Isınma (küp)
    b.spike(12);
    b.spike(17, 0, 2);
    b.block(22, 0, 3, 1); b.block(25, 0, 3, 2);
    b.spike(28, 0, 2);
    b.spike(34, 0, 3);

    // 2) Mavi zıplatıcı: tavanda yürüyüş
    b.color(40, 190);
    b.block(44, 6, 40, 1);
    b.pad(48, 0, 'blue');
    b.spike(51, 0, 28);
    b.spikeDown(57, 5);
    b.spikeDown(63, 5, 2);
    b.coin(68, 3);
    b.spikeDown(72, 5, 3);
    b.pad(79, 5, 'blue', true);
    b.spike(89);

    // 3) UFO (yavaş): tek dokunuşla zıplamayı öğret
    b.color(92, 250);
    b.speed(93, 'slow');
    b.mode(95, 'ufo', { ceil: 9 });
    b.spike(100, 0, 72);
    b.block(102, 0, 1, 2);
    b.block(106, 0, 1, 3);
    b.block(110, 0, 2, 2);
    b.block(114, 0, 1, 4); b.spike(114, 4);
    b.block(118, 0, 2, 2); b.block(118, 6, 2, 3);
    // alçak tavanlı tünel
    b.block(122, 0, 2, 1); b.block(122, 5, 24, 4);
    b.block(127, 0, 2, 2);
    b.spikeDown(131, 4, 2);
    b.block(135, 0, 2, 2);
    b.spikeDown(139, 4, 2);
    b.block(143, 0, 1, 1);
    // mavi küre: tavana ters uçuş
    b.orb(149, 2, 'blue');
    b.block(152, 0, 2, 4); b.spike(152, 4, 2);
    b.block(156, 8, 2, 1);
    b.block(159, 0, 2, 4); b.spike(159, 4, 2);
    b.block(162, 8, 3, 1);
    b.coin(163, 5);
    b.block(166, 0, 2, 4); b.spike(166, 4, 2);
    b.gravity(169, 'normal');
    b.speed(175, 'normal');
    b.mode(177, 'cube');

    // 4) Mavi küreler (küp)
    b.color(177, 300);
    b.block(188, 5, 26, 1);
    b.orb(190, 2, 'blue');
    b.spike(192, 0, 15);
    b.spikeDown(197, 4);
    b.spikeDown(202, 4, 2);
    b.orb(207, 2, 'blue');
    b.spikeDown(209, 4, 5);
    b.spike(217, 0, 2);

    // 5) Kısa gemi
    b.color(220, 330);
    b.mode(222, 'ship', { ceil: 9 });
    b.spike(228, 0, 30);
    b.block(230, 0, 2, 2); b.block(230, 7, 2, 2);
    b.block(238, 0, 2, 4);
    b.block(246, 0, 2, 2); b.block(246, 6, 2, 3);
    b.block(253, 0, 2, 3); b.block(253, 6, 2, 3);
    b.mode(259, 'cube');

    // 6) Final: yer çekimi zikzak
    b.color(262, 20);
    b.block(270, 5, 44, 1);
    b.pad(272, 0, 'blue');
    b.spike(275, 0, 6);
    b.spikeDown(279, 4, 3);
    b.pad(282, 4, 'blue', true);
    // gizli yol: isteğe bağlı mavi küre tavana geri götürür
    b.orb(285, 2, 'blue');
    b.coin(288, 4);
    b.spikeDown(290, 4, 2);
    b.spike(287, 0, 2);
    b.orb(292, 2, 'blue');
    b.spike(294, 0, 6);
    b.spikeDown(296, 4, 2);
    b.orb(301, 2, 'blue');
    b.spikeDown(305, 4, 9);
    b.spike(306, 0, 2);
    // Bitiş
    b.color(314, 160);
    b.pad(318);
    b.spike(319, 0, 5);
    b.block(321, 3, 4, 1);
  },
});
