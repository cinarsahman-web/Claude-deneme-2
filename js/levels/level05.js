KK.registerLevel({
  id: 5,
  name: 'Dalga Boyu',
  difficulty: 'hard',
  stars: 5,
  length: 380,
  hue: 185,
  music: { bpm: 160, root: 41, scale: 'minor', prog: [0, 6, 5, 4], drums: 'dnb', lead: 'stabs', seed: 505 },
  build(b) {
    // Dalga koridoru: her sütun (genişlik w) için zemin yüksekliği verilir, tavan = zemin + açıklık.
    const corridor = (x0, floors, gap, top, w = 1) => {
      for (let i = 0; i < floors.length;) {
        let j = i;
        while (j + 1 < floors.length && floors[j + 1] === floors[i]) j++;
        const f = floors[i], n = (j - i + 1) * w;
        if (f > 0) b.block(x0 + i * w, 0, n, f);
        if (f + gap < top) b.block(x0 + i * w, f + gap, n, top - f - gap);
        i = j + 1;
      }
    };

    // 1) Isınma: testereleri tanı
    b.spike(12);
    b.saw(18.5, 0, 1);                                  // yerdeki testere: diken gibi üstünden atla
    b.spike(24, 0, 2);
    b.block(29, 0, 3, 1);
    b.saw(33, 0.4, 1);                                  // iki basamak arasındaki çukurda testere
    b.block(34, 0, 3, 2);
    b.spike(41, 0, 2);
    b.saw(46.5, 0, 1.3);

    // 2) Dalga: basılı tut = yukarı, bırak = aşağı
    b.color(52, 215);
    b.mode(54, 'wave', { ceil: 9 });
    b.block(60, 0, 2, 3);                               // yerden sütun: üstünden geç
    b.block(66, 6, 2, 3);                               // tavandan sütun: altından geç
    b.block(72, 0, 2, 4);
    b.block(78, 5, 2, 4);
    b.saw(85, 5, 1.3);                                  // ortadaki testere: altından geç
    b.coin(84, 7);                                      // para 1: testerenin üstünden dolaş
    b.saw(91, 0.5, 1.5); b.saw(91, 8.5, 1.5);           // testere kapısı
    corridor(96, [1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2, 1], 3, 9);
    b.mode(120, 'cube');

    // 3) Küp: küreler ve testereler
    b.color(120, 270);
    b.spike(128, 0, 6); b.orb(130, 2);                  // zıpla + sarı küre
    b.saw(140, 0, 1.2);                                 // büyük yer testeresi
    b.spike(146, 0, 5); b.orb(148, 2, 'pink');          // pembe küre: alçak testerenin altından
    b.saw(150, 5.3, 1);
    // mavi küre: tavan bloğunun altında ters yürüyüş
    b.block(160, 6, 24, 1);
    b.spike(158, 0, 19);
    b.orb(158, 2, 'blue');
    b.saw(166, 6, 1);                                   // tavana gömülü testere: aşağı zıpla
    b.spikeDown(172, 5);
    b.orb(176, 5, 'blue');                              // yoldaki küre: yere dön
    b.spikeDown(178, 5, 6);                             // atlanamaz: küre şart

    // 4) Mini dalga: daha dik! sık zikzak, dar koridor, yol ayrımı
    b.color(184, 315);
    b.size(186, 'mini');
    b.mode(188, 'wave', { ceil: 8 });
    b.block(195, 0, 1, 4);
    b.block(198, 3, 1, 5);
    b.block(201, 0, 1, 5);
    b.block(204, 3, 1, 5);
    corridor(208, [0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1], 2, 8);
    // alt yol: testere ve dikenler arasında yumuşak dalga; üst yol: dar testere slalomu ve para 2
    b.block(231, 3.5, 15, 2);
    b.saw(234, 0, 1); b.spikeDown(237, 2.5); b.saw(240, 0, 1); b.spikeDown(243, 2.5);
    b.saw(235, 8, 1); b.saw(238, 5.5, 1); b.saw(241.5, 8, 1); b.saw(244, 5.5, 1);
    b.coin(239, 6.5);

    // 5) Hızlı küp
    b.color(250, 350);
    b.size(250, 'normal');
    b.mode(250, 'cube');
    b.speed(252, 'fast');
    b.spike(260, 0, 2);
    b.saw(265.5, 0, 1.2);
    b.block(270, 0, 3, 1); b.block(273, 0, 3, 2); b.spike(276, 0, 3);
    b.pad(285); b.spike(286, 0, 4);                     // zıplatıcı: sütunun üstüne
    b.block(290, 0, 3, 3);
    b.spike(293, 0, 8); b.orb(294, 5);                  // sütundan atla + sarı küre

    // 6) Hızlı dalga: final
    b.color(308, 30);
    b.mode(310, 'wave', { ceil: 9 });
    b.block(318, 0, 2, 4); b.saw(319, 4, 1);            // testereli sütunlar
    b.block(324, 5, 2, 4); b.saw(325, 5, 1);
    b.block(330, 0, 2, 4); b.saw(331, 4, 1);
    // yarım basamaklı zikzak koridor, sonra sık zikzak (hızlı tıklama)
    corridor(336, [1, 1.5, 2, 2.5, 3, 3.5, 4, 4, 3.5, 3, 2.5, 2, 1.5, 1, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4], 2.5, 9, 0.5);
    corridor(347, [3.5, 3, 3, 3.5, 4, 4, 3.5, 3, 3, 3.5, 4, 4, 3.5, 3, 3, 3.5, 4, 4.5, 5, 5], 2.25, 9, 0.5);
    // son ayrım: üst yolda testere slalomu; alttaki dar tünelde para 3 (hemen dalış gerekir)
    b.block(361, 3, 10, 1.5);
    b.saw(363, 8, 1.5); b.saw(365.5, 5, 1.5); b.saw(368, 8, 1.5); b.saw(370.5, 5, 1.5);
    b.spike(364); b.spikeDown(367, 2); b.coin(365, 1);
    b.mode(374, 'cube');                                // bitiş
    b.color(374, 60);
  },
});
