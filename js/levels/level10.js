KK.registerLevel({
  id: 10,
  name: 'Gece Yarısı',
  difficulty: 'insane',
  stars: 10,
  length: 478,
  hue: 245,
  start: { mode: 'cube', speed: 'fast', grav: 1, size: 'normal' },
  music: { bpm: 142, root: 38, scale: 'minor', prog: [0, 5, 6, 4], drums: 'half', lead: 'pluck', seed: 1010 },
  build(b) {
    // Bloklar kaydedilir; diken sıraları blokların içine düşen hücreleri atlar.
    const solid = [];
    const block = (x, y, w = 1, h = 1) => { solid.push({ x, y, w, h }); b.block(x, y, w, h); };
    const covered = (x, y) => solid.some(o => x < o.x + o.w && x + 1 > o.x && y < o.y + o.h && y + 1 > o.y);
    const spikeRow = (x0, n, y = 0) => { for (let i = 0; i < n; i++) if (!covered(x0 + i, y)) b.spike(x0 + i, y); };
    const ceilRow = (x0, n, y) => { for (let i = 0; i < n; i++) if (!covered(x0 + i, y)) b.spikeDown(x0 + i, y); };
    // Koridor: her sütun için zemin yüksekliği, tavan = zemin + açıklık.
    const corridor = (x0, floors, gap, top) => {
      for (let i = 0; i < floors.length;) {
        let j = i;
        while (j + 1 < floors.length && floors[j + 1] === floors[i]) j++;
        const f = floors[i], w = j - i + 1;
        if (f > 0) block(x0 + i, 0, w, f);
        if (f + gap < top) block(x0 + i, f + gap, w, top - f - gap);
        i = j + 1;
      }
    };

    // 1) Giriş: hızlı küp
    b.spike(12);
    b.spike(17, 0, 2);
    b.saw(23.5, 0, 1);
    block(28, 0, 2, 1); block(30, 0, 2, 2); b.spike(32, 0, 3);
    b.saw(38.5, 0, 1);
    b.slab(46, 1.5, 4);                                 // alçak çatı: altından geç ya da üstüne çık
    b.coin(49, 4);                                      // para 1: çatıdan erken zıpla
    b.spike(52, 0, 10); b.orb(54, 2); b.orb(59, 2);     // iki sarı küre zinciri

    // 2) Gemi: testereli kapılar ve dar koridor
    b.color(62, 275);
    b.mode(64, 'ship', { ceil: 9 });
    block(72, 0, 2, 2); block(72, 5, 2, 4); b.saw(73, 5, 0.7);
    b.saw(77.5, 3.5, 1);                                // ortadaki testere: üstünden geç
    block(81, 0, 2, 5); block(81, 8, 2, 1); b.saw(82, 5, 0.7);
    block(89, 0, 2, 1); block(89, 4, 2, 5); b.saw(90, 4, 0.7);
    spikeRow(71, 24);
    corridor(95, [1, 1, 2, 2, 3, 3, 4, 4, 4, 3, 3, 2, 2, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 4, 4, 3], 3, 9);
    b.saw(103, 7, 0.7); b.saw(109, 1, 0.7); b.saw(118, 8, 0.7);   // dönemeçlerde testereler

    // 3) UFO: sütunlar, sonra ters yerçekimi
    b.color(126, 300);
    b.mode(128, 'ufo', { ceil: 9 });
    block(135, 0, 2, 3); b.saw(136, 3, 0.7);
    block(141, 0, 2, 4); block(141, 7.5, 2, 1.5);
    block(147, 0, 2, 2); block(147, 5, 2, 4);
    block(153, 0, 2, 4); block(153, 7, 2, 2);
    b.gravity(158, 'flip');                             // artık dokunuş aşağı iter
    block(165, 5, 2, 4);
    b.saw(168, 2, 1);
    block(171, 0, 2, 4);
    b.saw(174, 6.5, 1);
    block(177, 4, 2, 5);
    ceilRow(163, 18, 8);
    b.gravity(181, 'normal');
    spikeRow(135, 51);

    // 4) Örümcek: zemin ve tavan arasında ışınlan
    b.color(191, 330);
    b.mode(193, 'spider', { ceil: 7 });
    b.spike(200, 0, 3);
    b.spikeDown(206, 6, 3);
    b.spike(211, 0, 2);
    b.spikeDown(216, 6, 2);
    block(222, 0, 6, 2); b.spikeDown(224, 6, 3);     // yükselti: tavana çık, sonra üstüne in
    b.spike(228, 0, 3);
    block(233, 4, 6, 3); b.spike(234, 0, 4);          // asılı blok: yere in, altına girince tutun
    b.spikeDown(239, 6, 5);                             // bloğun sonunda tavan dikenli: yere in
    b.spike(246, 0, 9);
    block(247, 3, 3, 1); b.coin(248, 4);              // para 2: tavandan bloğun üstüne in, hemen geri dön
    b.gravity(256, 'normal');

    // 5) Dalga: testereli sütunlar, koridor, mini dalga
    b.color(256, 195);
    b.mode(258, 'wave', { ceil: 9 });
    block(267, 0, 1, 5); b.saw(267.5, 5, 0.8);          // testereli sütunlar: büyük zikzak
    block(272, 4, 1, 5); b.saw(272.5, 4, 0.8);
    block(277, 0, 1, 5); b.saw(277.5, 5, 0.8);
    spikeRow(265, 17); ceilRow(265, 17, 8);
    corridor(282, [1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2, 1], 3, 9);
    b.spike(300, 0, 7); b.spikeDown(300, 8, 7);
    b.size(301, 'mini');
    corridor(307, [1, 1, 2, 3, 3, 2, 1, 1, 2, 3, 4, 4, 3, 2], 2, 9);
    // yol ayrımı: alt yol güvenli, üst yolda testereler ve para 3
    block(324, 3.5, 9, 1.5);
    b.spike(327, 0); b.spikeDown(329, 2.5);
    b.saw(326, 8.5, 0.9); b.coin(328, 6.5); b.saw(330, 5.3, 0.9);
    block(332, 7, 3, 2);
    b.size(335, 'normal');

    // 6) Küp: mavi zıplatıcı ve küreler (sabit tavan)
    b.color(335, 220);
    b.mode(335, 'cube', { ceil: 7 });
    b.pad(342, 0, 'blue'); b.spike(343, 0, 22);
    b.spikeDown(351, 6);
    b.spikeDown(356, 6, 2);
    b.orb(363, 3, 'blue'); b.spikeDown(363, 6, 6);      // aşağı zıpla + mavi küre: yere dön
    b.spike(372, 0, 9); b.orb(373, 2); b.orb(376, 3.5, 'green');   // sarı küre + yeşil küre: tavana çık
    b.spikeDown(386, 6, 2);
    b.gravity(391, 'normal');

    // 7) Final: gemi ve dalga arka arkaya
    b.color(393, 350);
    b.mode(396, 'ship', { ceil: 8 });
    corridor(402, [1, 1, 2, 2, 3, 3, 4, 4, 3, 3, 2, 2], 3, 8);
    b.saw(408, 7, 0.6);
    b.mode(414, 'wave', { ceil: 8 });
    corridor(420, [2, 3, 4, 4, 3, 2, 1, 1, 2, 3], 3, 8);
    b.mode(430, 'ship', { ceil: 8 });
    corridor(436, [2, 2, 3, 3, 4, 4, 4, 4, 3, 3], 3, 8);
    b.saw(437, 2, 0.6); b.saw(442, 7, 0.6);
    b.mode(446, 'wave', { ceil: 8 });
    corridor(452, [1, 2, 3, 4, 3, 2, 1, 1], 3, 8);
    spikeRow(414, 6); spikeRow(430, 6); spikeRow(446, 6);
    b.mode(461, 'cube');
    b.spike(467, 0, 2);
    b.saw(473, 0, 1);
  },
});
