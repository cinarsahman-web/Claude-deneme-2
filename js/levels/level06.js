KK.registerLevel({
  id: 6,
  name: 'Robot Fabrikası',
  difficulty: 'hard',
  stars: 6,
  length: 400,
  hue: 25,
  music: { bpm: 132, root: 44, scale: 'harmonic', prog: [0, 6, 3, 4], drums: 'march', lead: 'stabs', seed: 606 },
  build(b) {
    // 1) Isınma (küp): mini dikenler ve yarım bloklar
    b.miniSpike(12);
    b.miniSpike(17, 0, 2);
    b.slab(23, 0, 3);
    b.slab(27, 1, 3);
    b.slab(31, 2, 3);
    b.miniSpike(26, 0, 8);
    b.spike(39, 0, 2);

    // 2) Robot (yavaş): kısa dokunuş / uzun basış
    b.color(44, 42);
    b.speed(46, 'slow');
    b.mode(48, 'robot');
    b.miniSpike(56);                                    // kısa dokunuş
    b.spike(61);
    b.block(66, 0, 2, 2);                               // orta
    b.block(73, 0, 3, 3);                               // uzun basış
    b.coin(78, 6);                                      // para 1: bloğun üstünden bir uzun zıplama daha
    // alçak tavanlı tünel: sadece kısa zıplama
    b.block(85, 4.5, 15, 1);
    b.spike(89);
    b.spike(95);
    b.spike(104, 0, 2);                                 // iki diken: kısa
    b.spike(111, 0, 3);                                 // üç diken: uzun

    // 3) Siyah küre (normal hız)
    b.color(116, 8);
    b.speed(118, 'normal');
    // a) makinenin üst bandından düş, siyah küreyle presin altına çak
    b.block(124, 0, 4, 2);
    b.block(131, 0, 6, 5);                              // üst bant
    b.block(134, 7, 7, 4);                              // bandın kapağı: burada zıplanmaz
    b.orb(137.5, 4, 'black');
    b.block(141, 1.5, 6, 9.5);                          // pres: altından geç
    // b) iskeledeki delikten alt koridora düş
    b.block(152, 0, 4, 2);
    b.spike(158, 0, 6);
    b.block(158, 4.5, 6, 0.5);
    b.block(161, 7, 14, 4);                             // tavan: iskelede zıplanmaz
    b.orb(164.5, 4, 'black');
    b.block(166.5, 4.5, 8, 0.5);
    b.spike(168, 5, 2); b.spike(172, 5, 2);
    b.miniSpike(169); b.miniSpike(173);

    // 4) Testere atölyesi: yarım blok iskeleler
    b.color(178, 200);
    b.saw(184, 0, 1);
    b.saw(190, 0, 1.4); b.saw(190, 5.2, 1);              // testere arası: kısa zıpla
    b.slab(195, 1.5, 6);                                // iskele 1 (üst 2)
    b.saw(197, 0, 1); b.saw(200, 0, 1);
    b.miniSpike(198, 2);
    b.saw(198.5, 7, 1);                                 // tepedeki testere: kısa zıpla
    b.slab(203, 2.5, 6);                                // iskele 2 (üst 3)
    b.saw(202, 0, 1); b.saw(205, 0, 1); b.saw(208, 0, 1);
    b.miniSpike(206, 3);
    b.saw(206.5, 8, 1);
    // alt koridor (testereler) / üst iskele (para 2)
    b.slab(212, 4, 10);
    b.saw(215, 0, 0.9); b.saw(219, 0, 0.9);
    b.coin(216, 5);                                     // para 2: iskele 2'den uzun zıpla
    b.spike(219, 4.5);
    b.saw(225, 0, 1.2);

    // 5) Gemi: fabrika bacası
    b.color(230, 280);
    b.mode(234, 'ship', { ceil: 9 });
    b.spike(240, 0, 30);
    b.block(243, 0, 2, 4); b.saw(244, 4, 1);
    b.block(250, 5, 2, 4); b.saw(251, 5, 1);
    b.saw(257, 1.8, 1.2); b.saw(257, 7.2, 1.2);
    b.block(262, 3.5, 7, 1);                            // bant: üstten geç ya da alttan para 3
    b.saw(265.5, 9, 1.2);
    b.coin(265, 1.5);                                   // para 3: bandın altındaki dar geçit
    b.block(270, 5.5, 2, 3.5);                          // çıkış: alçal
    b.mode(272, 'robot');

    // 6) Hızlı robot
    b.color(274, 320);
    b.speed(276, 'fast');
    b.miniSpike(284);
    b.spike(288, 0, 2);
    b.block(296, 0, 3, 3);                              // uzun: bloğa çık
    b.saw(302, 0, 1.4);                                 // bloğun üstünden kısa zıpla
    b.block(306, 4.5, 13, 1);                           // hızlı tünel: kısa dokunuşlar
    b.spike(309); b.spike(313); b.miniSpike(317);
    // hızlı delik
    b.block(322, 0, 4, 2);
    b.spike(329.5, 0, 7.5);
    b.block(329.5, 4.5, 7.5, 0.5);
    b.block(333, 7, 15, 4);                             // tavan
    b.orb(337.5, 4, 'black');
    b.block(340, 4.5, 8, 0.5);
    b.spike(341, 5, 2); b.spike(345, 5, 2);
    b.miniSpike(343);

    // 7) Final: sarı küreyle banda çık, siyah küreyle presin altına
    b.color(350, 15);
    b.spike(356, 0, 3);
    b.orb(357.5, 3);                                    // sarı küre: banda çık
    b.block(361, 0, 6, 5);                              // üst bant
    b.block(363.5, 7, 8, 4);                            // bandın kapağı
    b.orb(367.5, 4, 'black');
    b.block(371.5, 1.5, 6, 9.5);                        // son pres
    // son koşu: testere çukuru üstünde yarım blok merdiven
    b.slab(381, 1, 4);
    b.slab(388, 2, 3);
    b.saw(386, 0, 1.2); b.saw(392, 0, 1.2);
    b.block(394, 0, 6, 3);                              // bitiş platformu
  },
});
