KK.registerLevel({
  id: 2,
  name: 'Sektiren Top',
  difficulty: 'easy',
  stars: 2,
  length: 296,
  hue: 200,
  music: { bpm: 140, root: 48, scale: 'major', prog: [0, 4, 5, 3], drums: 'four', lead: 'pluck', seed: 2 },
  build(b) {
    // Isınma
    b.spike(14);
    b.spike(22, 0, 2);
    b.block(29, 0, 3, 1); b.spike(32, 0, 2);

    // Pembe zıplatıcılar: tek, zincir, platforma
    b.color(37, 175);
    b.pad(40, 0, 'pink'); b.spike(41, 0, 2);
    b.pad(48, 0, 'pink'); b.spike(49, 0, 2);
    b.pad(52, 0, 'pink'); b.spike(53, 0, 2);
    b.pad(60, 0, 'pink'); b.spike(61, 0, 2);
    b.block(63, 0, 7, 1); b.spike(70, 0, 2);
    b.coin(65, 3);                                  // platformda küçük bir zıplama

    // Pembe halkalar: tek, sonra iki tane art arda
    b.color(75, 140);
    b.spike(80, 0, 5); b.orb(82, 2, 'pink');
    b.spike(91, 0, 7); b.orb(92, 2, 'pink'); b.orb(95, 2, 'pink');

    // Ters yerçekimi: tavanda yürü
    b.color(101, 265);
    b.block(104, 6, 46, 1);                         // tavan 104..150
    b.gravity(108, 'flip');
    b.spike(112, 0, 34);                            // aşağısı tehlikeli
    b.spikeDown(117, 5);
    b.spikeDown(124, 5, 2);
    b.block(131, 5, 4, 1);                          // ters basamak
    b.spikeDown(140, 5, 2); b.orb(140, 3, 'pink');  // halka isteğe bağlı: aşağıdaki para için
    b.coin(142, 2);
    b.gravity(148, 'normal');

    // Top modu: tavana ve yere dön
    b.color(152, 25);
    b.block(155, 5, 80, 1);                         // tavan 155..235
    b.mode(159, 'ball');
    b.spike(166, 0, 3);
    b.spikeDown(175, 4, 3);
    b.spike(183, 0, 2);
    b.spikeDown(190, 4, 2);
    b.block(198, 0, 2, 2); b.spike(198, 2, 2);      // yüksek sütun: erken dön
    b.block(206, 3, 2, 2); b.spikeDown(206, 2, 2);  // asılı sütun: yerde kal
    b.spike(212, 0, 3);
    b.spikeDown(219, 4, 2); b.spikeDown(226, 4, 5); // aradaki boşlukta para
    b.coin(223, 4);
    b.mode(232, 'cube');

    // Final: hepsi bir arada
    b.color(235, 320);
    b.pad(239, 0, 'pink'); b.spike(240, 0, 2);
    b.pad(243, 0, 'pink'); b.spike(244, 0, 2);
    b.pad(247, 0, 'pink'); b.spike(248, 0, 2);
    b.block(252, 6, 25, 1);                         // tavan 252..277
    b.gravity(255, 'flip');
    b.spike(259, 0, 15);
    b.spikeDown(262, 5, 2);
    b.spikeDown(269, 5, 5); b.orb(271, 3, 'pink');
    b.gravity(276, 'normal');
    b.pad(283, 0, 'pink'); b.spike(284, 0, 4); b.orb(285, 2, 'pink');   // zıplatıcı + halka
  },
});
