KK.registerLevel({
  id: 5,
  name: 'Dalga Boyu',
  difficulty: 'hard',
  stars: 5,
  length: 378,
  hue: 185,
  music: { bpm: 160, root: 41, scale: 'minor', prog: [0, 6, 5, 4], drums: 'dnb', lead: 'stabs', seed: 505 },
  build(b) {
    // Dalga koridoru: her sütun için zemin yüksekliği verilir, tavan = zemin + açıklık.
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

    // 1) Isınma: testereleri tanı
    b.spike(12);
    b.saw(20, 0, 1);                                    // yerdeki testere: diken gibi üstünden atla
    b.block(26, 0, 4, 1);
    b.saw(31.5, 0, 1);                                  // iki basamak arasındaki çukurda testere
    b.block(33, 0, 3, 1);
    b.spike(36, 0, 2);
    b.saw(43, 0, 1);

    // 2) Dalga: basılı tut = yukarı, bırak = aşağı
    b.color(46, 215);
    b.mode(48, 'wave', { ceil: 9 });
    b.block(58, 0, 2, 3);                               // yerden sütun: üstünden geç
    b.block(64, 6, 2, 3);                               // tavandan sütun: altından geç
    b.coin(68, 7);                                      // para 1: tavana doğru küçük bir sapma
    b.block(70, 0, 2, 4);
    b.block(76, 5, 2, 4);
    b.saw(83, 1.5, 1.5);                                // testere kapıları
    b.saw(89, 7.5, 1.5);
    corridor(94, [1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3], 3, 9);
    b.mode(112, 'cube');

    // 3) Küp: küreler ve testereler
    b.color(112, 270);
    b.spike(120, 0, 6); b.orb(121, 2);                  // zıpla + sarı küre
    b.saw(132, 0, 1.2);
    b.block(136, 0, 2, 2); b.saw(137, 4.6, 0.9);        // sütun: üstündeki testereye çarpmadan geç
    b.spike(138, 0, 3);
    // mavi küre: tavana çık, ters yürü, mavi küreyle in
    b.block(143, 6, 33, 1);
    b.spike(147, 0, 21);
    b.orb(147, 2, 'blue');
    b.spikeDown(153, 5);
    b.spikeDown(159, 5, 2);
    b.orb(166, 4, 'blue'); b.spikeDown(168, 5, 8);        // tavan dikenle bitiyor: küreyi kullan

    // 4) Mini dalga: daha dik! önce yumuşak giriş, sonra sık zikzak ve dar koridor
    b.color(176, 315);
    b.size(178, 'mini');
    b.mode(180, 'wave', { ceil: 8 });
    b.block(187, 0, 1, 3);
    b.block(192, 4, 1, 4);
    b.block(196, 0, 1, 4); b.block(199, 3, 1, 5); b.block(202, 0, 1, 4); b.block(205, 3, 1, 5);
    corridor(209, [1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 3], 2, 8);
    // yol ayrımı: alt yol kolay; üst yolda diken sırası ve para 2
    b.block(224, 3, 12, 2);
    b.spike(227, 0, 2); b.spikeDown(231, 2, 2);
    b.spike(225, 5, 3); b.spikeDown(228, 7, 3); b.spike(231, 5, 3); b.spikeDown(234, 7, 2);
    b.coin(229, 5);
    b.saw(239, 1, 1); b.saw(242, 7, 1);
    b.size(246, 'normal');
    b.mode(246, 'cube');

    // 5) Hızlı küp
    b.color(246, 350);
    b.speed(248, 'fast');
    b.spike(256, 0, 2);
    b.saw(263, 0, 1.2);
    b.block(268, 0, 3, 1); b.block(271, 0, 3, 2); b.spike(274, 0, 3);
    b.spike(282, 0, 12); b.orb(284, 2); b.orb(289, 3);
    b.pad(299, 0, 'pink'); b.spike(300, 0, 3);

    // 6) Hızlı dalga: final
    b.color(304, 30);
    b.mode(306, 'wave', { ceil: 9 });
    b.block(314, 0, 2, 4); b.saw(315, 4, 1);            // testereli sütunlar
    b.block(320, 5, 2, 4); b.saw(321, 5, 1);
    b.block(326, 0, 2, 4); b.saw(327, 4, 1);
    corridor(332, [2, 3, 4, 5, 5, 4, 3, 2, 1, 1], 2.5, 9);
    corridor(342, [2, 3, 4, 4, 3, 2, 1, 1], 2, 9);      // koridor daralıyor
    // son ayrım: alt yol güvenli, üst yolda testereler ve para 3
    b.block(354, 3.5, 10, 1.5);
    b.spike(357, 0); b.spikeDown(360, 2.5);
    b.saw(357, 7.5, 0.9); b.coin(359, 6); b.saw(361, 5.5, 0.9);
    b.mode(366, 'cube');
    b.color(366, 60);
  },
});
