# Kare Koşusu

Tarayıcıda çalışan, Geometry Dash tarzı bir ritim-platform oyunu. Kurulum veya derleme gerekmez: `index.html` dosyasını bir tarayıcıda açman yeterli.

## Oyun

- **11 bölüm**, Kolay'dan Şeytani'ye: Neon Basamaklar, Sektiren Top, Uçan Daire, Ters Dünya, Dalga Boyu, Robot Fabrikası, Örümcek Ağı, Hız Treni, Kaos Teorisi, Gece Yarısı, Son Kare.
- **7 mod:** kare, gemi, top, UFO, dalga, robot, örümcek.
- **Portallar:** mod, yerçekimi (normal / ters), hız (yavaş, normal, hızlı, çok hızlı), boyut (mini / normal).
- **Halkalar:** sarı, pembe, mavi, yeşil, siyah. **Zıplatıcılar:** sarı, pembe, mavi. Ayrıca testereler, yarım bloklar ve küçük dikenler var.
- **Her bölümde 3 gizli para.** Bir para, bölümü normal modda bitirdiğin koşuda alınırsa kaydedilir.
- **Pratik modu:** kontrol noktaları otomatik konur. Elle koymak için Z, silmek için X; dokunmatik ekranda alttaki düğmeler.
- **Karakter ekranı:** 18 simge, 16 renk ve 5 iz efekti. Bunlar yıldız ve para topladıkça açılır.
- Her bölümün kendi müziği var; müzikler Web Audio ile anlık üretilir. Ayrıca istatistik ekranı ve ayarlar bulunur.

**Kontroller:** Boşluk, ↑, W, tıklama veya dokunma ile zıpla / uç. Esc veya P ile duraklat.

## Dosyalar

| Dosya | Görev |
| --- | --- |
| `index.html` | Sayfa yapısı ve stiller |
| `js/physics.js` | Fizik motoru ve bölüm modeli. Hem oyun hem araçlar kullanır |
| `js/levels/levelNN.js` | Bölüm verileri |
| `js/render.js` | Canvas çizimi, simgeler ve araç formları |
| `js/audio.js` | Müzik ve ses efektleri |
| `js/game.js` | Menüler, kayıt, giriş ve ana döngü |

## Bölüm araçları

Araçlar Node.js ile çalışır. `preview.js` ve `e2e.js` ayrıca Playwright gerektirir.

```sh
node tools/solve.js all      # her bölümün geçilebildiğini, zorluğuna göre affedici olduğunu ve paraların alınabildiğini kanıtlar
node tools/solve.js 5 --trace
node tools/preview.js 5      # tools/out/level05.png: bölümün tamamı ve çözücünün bulduğu yol
node tools/e2e.js            # her bölümü gerçek oyunda, çözücünün girdileriyle baştan sona oynatır
```

`solve.js`, oyunun kendi fizik kodunu çalıştırıp her basma/bırakma zamanlamasını arar. Bir bölüm, zorluğuna göre belirlenen kaba bir zamanlama aralığıyla da bitirilebilmelidir:

| Zorluk | Karar sıklığı |
| --- | --- |
| Kolay | 20 Hz |
| Normal | 24 Hz |
| Zor | 30 Hz |
| Daha Zor | 34 Hz |
| Çılgın | 40 Hz |
| Şeytani | 48 Hz |
