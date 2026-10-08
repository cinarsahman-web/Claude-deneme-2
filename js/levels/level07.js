KK.registerLevel({
  id: 7,
  name: 'Örümcek Ağı',
  difficulty: 'harder',
  stars: 7,
  length: 420,
  hue: 300,
  music: { bpm: 172, root: 42, scale: 'phrygian', prog: [0, 1, 6, 4], drums: 'dnb', lead: 'arp', seed: 707 },
  build(b) {
    // 1) Isınma: küp, normal hız
    b.spike(12);
    b.spike(17, 0, 2);
    b.block(23, 0, 3, 1); b.block(26, 0, 3, 2); b.spike(29, 0, 2);
    b.spike(35, 0, 5); b.orb(37, 2);

    // 2) Örümcek tanıtımı (hızlı, tavan 7): bas = karşı yüzeye ışınlan
    b.color(42, 330);
    b.speed(44, 'fast');
    b.mode(46, 'spider', { ceil: 7 });
    b.spike(55, 0, 6);                                  // uzun diken sırası: tavana çık
    b.spikeDown(65, 6, 6);                              // tavanda dikenler: yere in
    b.spike(75, 0, 3);
    b.spikeDown(81, 6, 3);
    b.block(88, 3.5, 6, 3.5); b.spike(90, 0, 4);        // asılı blok: altına tutun, bitince tavana düş
    b.spikeDown(101, 6, 3);
    b.block(108, 0, 6, 2); b.spikeDown(110, 6, 2);      // yükselti: tavandan üstüne in
    b.coin(113, 6);                                     // para 1: yükseltinin sonunda tavana çık
    b.spike(120, 0, 2);
    b.spikeDown(124, 6, 2);
    b.spike(128, 0, 2);
    b.spikeDown(132, 6, 2);

    // 3) Top + yer çekimi kapıları (hızlı, tavan 6)
    b.color(137, 20);
    b.mode(140, 'ball', { ceil: 6 });
    b.spike(148, 0, 3);
    b.spikeDown(154, 5, 3);
    b.saw(161, 0, 1);                                   // yerdeki testere
    b.spikeDown(164, 5, 2);
    b.gravity(169, 'flip'); b.spike(172, 0, 5);         // kapı topu tavana atar
    b.spikeDown(181, 5, 3);                             // hemen geri dön
    b.block(187, 0, 6, 2); b.spikeDown(189, 5, 2);      // yükseltinin üstüne in
    b.spike(193, 0, 4);                                 // yükseltiden tavana
    b.gravity(199, 'normal'); b.spike(207, 0, 3);       // kapı seni indirir: yere değer değmez yine çık

    // 4) Örümcek ağı (tavan 9): sütunların üstü ve sarkıtların altı arasında sıçra
    b.color(211, 260);
    b.mode(213, 'spider', { ceil: 9 });                 // tavana düş
    b.spike(220, 0, 4);
    b.block(225, 0, 6, 2);                              // A: tavandan üstüne in
    b.block(229, 5, 6, 4);                              // B: altına tutun
    b.spike(231, 0, 2);
    b.block(233, 0, 8, 3);                              // C
    b.block(239, 6, 6, 3);                              // D
    b.spike(241, 0, 2);
    b.block(243, 0, 8, 4);                              // E
    b.block(249, 6, 8, 2);                              // F (zirve): üstünde dar tavan geçidi
    b.coin(252, 8);                                     // para 2: E'den erken bas, F'nin üstünden geç, G'ye in
    b.saw(253, 0.3, 1.4);                               // ağın dibinde testere
    b.block(255, 0, 8, 3);                              // G
    b.block(260, 5, 10, 4);                             // H
    b.spike(263, 0, 5);
    b.block(268, 0, 6, 1);                              // I
    b.spikeDown(270, 8, 4);

    // 5) Küp: yer çekimi oyunları (tavan 8)
    b.color(274, 170);
    b.mode(277, 'cube', { ceil: 8 });
    b.gravity(277, 'normal');
    b.spike(284, 0, 2);
    b.block(289, 0, 3, 1); b.spike(292, 0, 2);
    b.gravity(297, 'flip'); b.spike(299, 0, 4);         // tavana düş
    b.spikeDown(305, 7, 2);                             // ters zıpla
    b.orb(310, 5, 'blue'); b.spikeDown(311, 7, 6);      // mavi küre: yere dön
    b.spike(320, 0, 2);
    b.pad(325, 0, 'blue'); b.spike(326, 0, 4);          // mavi zıplatıcı: tavana
    b.spikeDown(332, 7, 2);
    b.pad(337, 7, 'yellow', true); b.spikeDown(338, 7, 5);  // ters sarı zıplatıcı
    b.gravity(346, 'normal');

    // 6) Final (tavan 7): sık örümcek ritmi, yer çekimi kapısı, yüzen çubuk, top
    b.color(348, 340);
    b.mode(350, 'spider', { ceil: 7 });
    b.spike(357, 0, 2);
    b.spikeDown(361, 6);                                // tek dikenler: hızlı aşağı-yukarı
    b.spike(364);
    b.spikeDown(367, 6);
    b.gravity(370, 'flip'); b.spike(372, 0, 3);         // kapı örümceği tavana düşürür
    // yüzen çubuk: üst yol (tavan / çubuğun üstü) ya da alt yol (yer / çubuğun altı, para 3)
    b.block(378, 3, 12, 1);
    b.spikeDown(380, 6, 3); b.spike(385, 4, 2);         // üst yol: çubuğa in, tavana dön
    b.spike(380); b.spikeDown(383, 2); b.spike(386, 0, 3);   // alt yol: dört hızlı dokunuş
    b.coin(383, 0);
    b.spike(390, 0, 4);
    // top: son dönüşler
    b.color(394, 45);
    b.mode(396, 'ball', { ceil: 7 });
    b.spikeDown(403, 6, 2);
    b.gravity(408, 'flip'); b.spike(411, 0, 3);         // kapı topu tavana atar
    b.spikeDown(416, 6, 2);                             // son dönüş
  },
});
