KK.registerLevel({
  id: 9,
  name: 'Kaos Teorisi',
  difficulty: 'insane',
  stars: 9,
  length: 460,
  hue: 340,
  music: { bpm: 174, root: 38, scale: 'harmonic', prog: [0, 5, 3, 4], drums: 'break', lead: 'melody', seed: 909 },
  build(b) {
    // Dalga koridoru: her sütun için zemin yüksekliği, tavan = zemin + açıklık.
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

    // ---------- 1. tur: normal hız, yedi mod ----------
    // 1) Küp: ısınma + sarı küre
    b.spike(10);
    b.spike(14, 0, 2);
    b.block(19, 0, 2, 1); b.spike(21, 0, 7); b.orb(23, 3, 'yellow');

    // 2) Gemi: üç kapı
    b.color(30, 300);
    b.mode(32, 'ship', { ceil: 8 });
    b.spike(39, 0, 17);
    b.block(39, 0, 2, 3); b.block(39, 6, 2, 2);
    b.block(44, 0, 2, 1); b.block(44, 4, 2, 4);
    b.block(49, 0, 2, 4); b.block(49, 7, 2, 1);

    // 3) Top: tavan-taban, yerdeki sarı küreyle ortadan geç
    b.mode(57, 'ball', { ceil: 6 });
    b.spike(64, 0, 3);
    b.spikeDown(70, 5, 3);
    b.orb(75, 0, 'yellow'); b.spike(76, 0, 4); b.spikeDown(76, 5, 4);

    // 4) UFO: sütunlar arasında zıpla
    b.gravity(85, 'normal');
    b.mode(86, 'ufo', { ceil: 8 });
    b.spike(92, 0, 20);
    b.block(95, 0, 2, 2);
    b.coin(96, 5);                                      // para 1: ilk sütunun üstünde, birkaç fazla dokunuş
    b.block(100, 4, 2, 4);
    b.block(104, 0, 2, 3);
    b.block(109, 0, 1, 2); b.block(109, 5, 1, 3);

    // 5) Dalga: iki sütun, sonra zikzak koridor
    b.mode(114, 'wave', { ceil: 8 });
    b.block(120, 0, 2, 3);
    b.block(124, 5, 2, 3);
    corridor(128, [1, 2, 3, 4, 4, 3, 2, 1, 1], 3, 8);

    // 6) Robot: kısa/uzun zıplama, siyah küre
    b.mode(141, 'robot');
    b.spike(147);
    b.block(151, 0, 2, 2); b.spike(153, 0, 2);
    b.block(160, 0, 1, 3); b.orb(161, 4, 'black');      // sütunu aş, siyah küreyle çatının altına dal
    b.block(163, 2, 8, 1); b.spike(163, 3, 8);

    // 7) Örümcek: taban-tavan, sonra orta çubuk
    b.color(172, 255);
    b.mode(174, 'spider', { ceil: 7 });
    b.spike(180, 0, 3);
    b.spikeDown(184, 6, 3);
    b.spike(188, 0, 2);
    b.block(192, 3, 6, 1);                              // orta çubuk: üstüne in (ana yol) ya da altına asıl (para 2)
    b.spike(193, 0, 5);
    b.spikeDown(194, 6, 5);
    b.coin(195, 2);
    b.spike(203, 0, 2);
    b.speed(204, 'fast');

    // ---------- 2. tur: hızlı, mini ve yer çekimi ----------
    // 8) Mini küp: mavi zıplatıcıyla tavana, mavi küreyle geri
    b.color(205, 200);
    b.gravity(205, 'normal');
    b.mode(206, 'cube', { ceil: 8 });
    b.size(207, 'mini');
    b.spike(214);
    b.spike(218, 0, 2);
    b.pad(223, 0, 'blue'); b.spike(224, 0, 10);
    b.spikeDown(228, 7);
    b.orb(231, 7, 'blue'); b.spikeDown(233, 7, 4);

    // 9) Dalga: normal, sonra mini (dik)
    b.size(238, 'normal');
    b.mode(239, 'wave', { ceil: 9 });
    b.block(246, 0, 2, 4);
    b.block(251, 5, 2, 4);
    b.size(255, 'mini');
    corridor(259, [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 1], 2, 9);

    // 10) Gemi: yer çekimi ters (basılı tutmak aşağı indirir)
    b.color(272, 150);
    b.size(273, 'normal');
    b.mode(274, 'ship', { ceil: 9 });
    b.spike(281, 0, 24);
    b.block(281, 0, 2, 4);
    b.block(286, 5, 2, 4);
    b.gravity(289, 'flip');
    b.block(294, 0, 2, 3); b.block(294, 7, 2, 2);
    b.block(299, 5, 2, 4);
    b.block(303, 0, 2, 4);
    b.gravity(306, 'normal');

    // 11) Top: tavan-taban, sonra mini top: tünelin altı (ana yol) ya da üstündeki dar şerit (para 3)
    b.mode(307, 'ball', { ceil: 6 });
    b.spike(314, 0, 3);
    b.spikeDown(319, 5, 2);
    b.size(323, 'mini');
    b.block(329, 3, 8, 2);
    b.spike(331, 0, 2);
    b.spikeDown(334, 2, 2);
    b.miniSpikeDown(331, 5); b.coin(333, 5); b.miniSpike(335, 5);

    // 12) UFO: ters yer çekiminde, tavan dikenli
    b.gravity(337, 'normal');
    b.size(338, 'normal');
    b.mode(339, 'ufo', { ceil: 8 });
    b.spike(346, 0, 18);
    b.block(346, 0, 2, 3);
    b.block(350, 5, 2, 3);
    b.gravity(353, 'flip');
    b.spikeDown(355, 7, 9);
    b.block(358, 5, 2, 2);
    b.block(362, 0, 2, 4);
    b.gravity(365, 'normal');

    // 13) Robot: alçak çatı (kısa bas), pembe küre zinciri
    b.color(366, 40);
    b.mode(367, 'robot');
    b.block(373, 4, 4, 1); b.spike(374);
    b.spike(381, 0, 12); b.orb(385, 3, 'pink'); b.orb(389, 3, 'pink');

    // 14) Örümcek: çok hızlı ritim
    b.speed(393, 'faster');
    b.mode(395, 'spider', { ceil: 7 });
    b.spike(403);
    b.spikeDown(405, 6);
    b.spike(407);
    b.spikeDown(409, 6);
    b.spike(411, 0, 2);

    // 15) Mini dalga (çok hızlı): testereli sütunlar, dar koridor
    b.gravity(415, 'normal');
    b.mode(416, 'wave', { ceil: 9 });
    b.size(416, 'mini');
    b.block(424, 0, 2, 4); b.saw(425, 4, 1);
    b.block(429, 5, 2, 4); b.saw(430, 5, 1);
    b.block(433, 0, 6, 1); b.spike(433, 1, 6);          // dikenli dar şerit: hızlı zikzak
    b.block(433, 4, 6, 5); b.spikeDown(433, 3, 6);

    // 16) Küp: sarı zıplatıcıyla bloğa, yeşil küreyle tavana, bitiş
    b.color(439, 320);
    b.speed(440, 'fast');
    b.size(440, 'normal');
    b.mode(440, 'cube', { ceil: 8 });
    b.pad(447); b.block(449, 0, 3, 3);
    b.spike(452, 0, 8); b.orb(454, 4, 'green');
  },
});
