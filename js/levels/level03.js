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

    // 3) UFO (yavaş)
    b.color(92, 250);
    b.speed(93, 'slow');
    b.mode(95, 'ufo', { ceil: 9 });
    b.spike(100, 0, 71);
    b.block(103, 0, 1, 2);
    b.block(108, 0, 1, 3);
    b.block(113, 0, 2, 2); b.block(113, 6, 2, 3);
    b.block(119, 0, 2, 4); b.block(119, 8, 2, 1);
    b.block(125, 0, 2, 1); b.block(125, 4, 2, 5);
    // mavi küre: tavana ters uçuş
    b.orb(131, 4, 'blue');
    b.block(136, 7, 1, 2);
    b.coin(139, 2);
    b.block(141, 0, 2, 2); b.block(141, 6, 2, 3);
    b.block(147, 0, 2, 1); b.block(147, 5, 2, 4);
    b.orb(153, 4, 'blue');
    b.block(158, 0, 2, 3); b.block(158, 7, 2, 2);
    b.block(164, 0, 2, 2); b.block(164, 6, 2, 3);
    b.speed(173, 'normal');
    b.mode(175, 'cube');

    // 4) Mavi küreler (küp)
    b.color(175, 300);
    b.block(188, 5, 26, 1);
    b.orb(190, 2, 'blue');
    b.spike(192, 0, 15);
    b.spikeDown(197, 4);
    b.spikeDown(202, 4, 2);
    b.orb(207, 2, 'blue');
    b.spike(217, 0, 2);

    // 5) Kısa gemi
    b.color(220, 330);
    b.mode(222, 'ship', { ceil: 9 });
    b.spike(227, 0, 31);
    b.block(230, 0, 2, 3); b.block(230, 7, 2, 2);
    b.block(236, 0, 2, 5);
    b.coin(239, 1);
    b.block(242, 0, 2, 2); b.block(242, 5, 2, 4);
    b.block(248, 0, 2, 4); b.block(248, 8, 2, 1);
    b.block(254, 0, 2, 1); b.block(254, 5, 2, 4);
    b.mode(260, 'cube');

    // 6) Final: yer çekimi zikzak
    b.color(262, 20);
    b.block(270, 5, 44, 1);
    b.pad(272, 0, 'blue');
    b.spike(275, 0, 6);
    b.spikeDown(277, 4);
    b.pad(282, 4, 'blue', true);
    b.spike(287, 0, 2);
    b.orb(292, 2, 'blue');
    b.spike(294, 0, 6);
    b.spikeDown(296, 4, 2);
    b.orb(301, 2, 'blue');
    b.spike(305, 0, 3);
    b.spikeDown(305, 4, 9);
    b.color(314, 160);
    b.pad(318);
    b.spike(319, 0, 5);
    b.block(321, 3, 4, 1);
  },
});
