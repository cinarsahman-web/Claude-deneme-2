KK.registerLevel({
  id: 4,
  name: 'Ters Dünya',
  difficulty: 'normal',
  stars: 4,
  length: 355,
  hue: 270,
  music: { bpm: 152, root: 40, scale: 'phrygian', prog: [0, 1, 5, 3], drums: 'break', lead: 'arp', seed: 404 },
  build(b) {
    // 1) Isınma
    b.spike(12);
    b.spike(17, 0, 2);
    b.block(23, 0, 3, 1); b.block(26, 0, 3, 2); b.spike(29, 0, 2);
    b.spike(34);

    // 2) Ters yürüyüş: tavan bloğunun altında
    b.color(37, 300);
    b.block(40, 7, 54, 1);
    b.gravity(42, 'flip');
    b.spike(46, 0, 40);
    b.spikeDown(51, 6);
    b.spikeDown(57, 6, 2);
    b.coin(62, 4);                                      // para 1: boşlukta aşağı zıpla
    b.block(68, 6, 3, 1); b.block(71, 5, 3, 2); b.spikeDown(74, 6, 2);   // ters merdiven
    b.spikeDown(81, 6, 2);
    b.gravity(87, 'normal');

    // 3) Gemi: yer çekimi değişiyor
    b.color(95, 330);
    b.mode(97, 'ship', { ceil: 9 });
    b.spike(103, 0, 50);
    b.block(106, 0, 2, 5);
    b.block(113, 4, 2, 5);
    b.block(120, 0, 2, 5);
    b.gravity(125, 'flip');                             // artık basılı tutmak aşağı indirir
    b.spikeDown(131, 8, 22);
    b.block(132, 3, 6, 1);                              // alttaki dar geçit: para 2
    b.coin(134, 1);
    b.block(142, 4, 2, 5);
    b.block(149, 0, 2, 4);

    // 4) Yeşil küreler (küp, sabit tavan)
    b.color(154, 200);
    b.mode(154, 'cube', { ceil: 8 });
    b.spikeDown(162, 7);
    b.orb(168, 7, 'green'); b.spikeDown(171, 7, 10);   // yoldaki küre: yere in
    b.spike(177);
    b.spike(182, 0, 2);
    b.spike(188); b.orb(189, 2, 'green');               // zıpla + küre: tavana çık
    b.spike(193, 0, 12);
    b.spikeDown(199, 7);
    b.spikeDown(205, 7); b.orb(206, 5, 'green');        // ters zıpla + küre: yere in
    b.spikeDown(210, 7, 8);

    // 5) Mini küp: alçak tünel; yeşil küreyle tavandan riskli yol (para 3)
    b.color(220, 160);
    b.size(222, 'mini');
    b.spike(228);
    b.spike(232);
    b.orb(236, 0, 'green');                             // isteğe bağlı: tavana çık
    b.block(241, 3, 26, 1);                             // tünelin tavanı
    // alt yol (tünel)
    b.spike(245);
    b.spike(249);
    b.gravity(253, 'flip');
    b.spike(255, 0, 12);
    b.spikeDown(259, 2);
    b.spikeDown(264, 2);
    // üst yol (tavan)
    b.spikeDown(244, 7);
    b.spikeDown(248, 7, 2);
    b.coin(254, 7);
    b.spikeDown(258, 7);
    b.spikeDown(262, 7, 2);
    // buluşma
    b.spikeDown(274, 7);
    b.gravity(278, 'normal');
    b.size(282, 'normal');

    // 6) Final: ters zıplatıcılar, yeşil küre pinpon, ters bitiş
    b.color(284, 20);
    b.gravity(286, 'flip');
    b.spike(291, 0, 21);
    b.spikeDown(294, 7);
    b.pad(300, 7, 'yellow', true); b.spikeDown(301, 7, 4);
    b.pad(311, 7, 'yellow', true); b.spikeDown(312, 7, 8);
    b.orb(313, 3, 'green');                             // zıplatıcının dibinde: yere dön
    b.spike(324); b.orb(325, 2, 'green');
    b.spike(329, 0, 11);
    b.spikeDown(335, 7); b.orb(336, 5, 'green');
    b.spikeDown(339, 7, 8);
    b.color(344, 350);
    b.gravity(347, 'flip');
    b.spike(350, 0, 6);
  },
});
