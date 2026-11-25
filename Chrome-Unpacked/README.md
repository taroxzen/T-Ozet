# 🎯 T-Özet

[![Sürüm](https://img.shields.io/badge/version-1.1.0-D71921?style=for-the-badge)](https://github.com/taroxzen/T-Ozet/releases)
[![Tarayıcı](https://img.shields.io/badge/Chrome%20%2F%20Brave%20%2F%20Edge-Manifest%20V3-5B9BF6?style=for-the-badge)](#-kurulum)
[![Tema](https://img.shields.io/badge/theme-Nothing%20Design-000000?style=for-the-badge)](#-tasarım)
[![Geliştirici](https://img.shields.io/badge/dev-taroxzen-999999?style=for-the-badge)](https://github.com/taroxzen)

> [!NOTE]
> 🎯 Haberleri, forumları ve seçtiğin metinleri **Gemini** ile saniyeler içinde özetleyen hafif tarayıcı eklentisi.
> 🧠 Prompt şablonları Ayarlar'da, eylem butonları popup'ta.
> 🎨 Koyu **Nothing Design** · 🔒 Sıfır kayıt · 🧱 Sürüm **1.1.0**
> 🏠 https://github.com/taroxzen/T-Ozet · 📄 **GPL-3.0** · 👤 Taroxzen

<div align="center">

| 🎯 **T-Özet** | 🧠 **Gemini** | 🔒 **Sıfır Kayıt** | 🎨 **Nothing Design** |
|:---:|:---:|:---:|:---:|
| Tek amaç: hızlı özet | Geçici Sohbet | Özet geçmişi yok | OLED siyah, düz yüzeyler |

</div>

---

## 🎯 Ne yapar?

Bir haberi açarsın → sağ tıkla ya da metni seç → **T-Özet** sayfanın DOM metnini alır,
seçtiğin şablona göre bir prompt oluşturur, Gemini'de **Geçici Sohbet** modunu açar,
prompt'u yazar ve gönderir. Cevap Gemini penceresinde belirir.

```
Web sayfası  →  DOM metni  →  Prompt şablonu  →  Gemini (Geçici Sohbet)  →  Özet
```

> [!TIP]
> 🧭 **Hızlı gezinme** · ✨ [Özellikler](#-özellikler) · 📸 [Ekran görüntüleri](#-ekran-görüntüleri) · ⚙️ [Kurulum](#-kurulum) · 🧭 [Kullanım](#-kullanım) · 🔐 [İzinler](#-izinler) · 🛡️ [Gizlilik](#-gizlilik-ve-güvenlik) · 📄 [Lisans](#-lisans)

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 🧠 **8 prompt şablonu** | Basit Özet, 2 Kelimede Flaş, Madde Madde, Tablo, 5N1K, Basit Anlat, Yönetici Özeti, Özel Prompt — popup ve Ayarlar'da senkron |
| 🖱️ **3 tetikleme yolu** | Metin seçimi balonu, `Alt + S`, sağ tık menüsü |
| 📄 **Doğrudan DOM** | Siteye özel seçici yok. Sayfanın HTML/DOM metnini doğrudan alır (40.000 karakter sınırı) |
| 🔒 **Geçici Sohbet** | Her özet öncesi Gemini'de geçici sohbet açılmaya çalışılır |
| 🎯 **Buton öğretimi** | Gemini arayüzü değişirse Ayarlar'dan **Geçici Sohbet** ve **Gönder** butonları ayrı ayrı öğretilir |
| 🧪 **Test & sıfırlama** | Öğretilen butonları Ayarlar'dan test et veya imzayı sıfırla |
| 🪟 **Akıllı popup** | Gemini penceresinin boyut/konumu sürüklenebilir monitörden ayarlanır |
| 🧹 **Otomatik temizlik** | Kaynak sekme kapanınca Gemini popup'ı kapanır; açılışta eski pencereler temizlenir |
| ⌨️ **Kısayol** | `Alt + S` ile açık sayfayı anında özetle |
| 🎨 **Nothing Design** | OLED siyah, Doto + Space Grotesk + Space Mono, gölgesiz düz yüzeyler |
| 🤖 **AI oto öğrenme** | Gemini değişse de aday butonu sezgisel bulur; **OK** ile onaylarsın |
| 🧭 **SPA desteği** | `webNavigation` ile geçişlerde script erken injection |
| 🖥️ **Çoklu monitör** | `system.display` ile popup ekran sınırlarına clamp |
| 🧹 **Offscreen DOMParser** | Ayarlar'da ham HTML'den temiz metin çıkarma |

---

## 📸 Ekran görüntüleri

> [!NOTE]
> 🖼️ Görüntüler **Brave 158** üzerinde, eklenti `Chrome-Unpacked` klasöründen yüklenerek alındı.
> 🎯 Soldaki kutular gerçek arayüzü gösterir; örnek/mockup değildir.

### Popup

<img src="docs/screenshots/popup.png" width="320" alt="T-Özet popup arayüzü">

### Ayarlar

<img src="docs/screenshots/ayarlar.png" width="900" alt="T-Özet ayarlar sayfası">

---

## ⚙️ Kurulum

### Chrome / Brave / Edge

1. `brave://extensions` veya `chrome://extensions` adresini aç.
2. **Geliştirici modu** → aç.
3. **Paketlenmemiş öğe yükle** → `Chrome-Unpacked` klasörünü seç.
4. Eklenti simgesine tıkla, şablonunu seç, özetlemeye başla.

### Firefox (geçici)

1. `about:debugging#/runtime/this-firefox` adresini aç.
2. **Geçici Eklenti Yükle** → `manifest.json` dosyasını seç.

> [!TIP]
> 📦 Hazır paketler: [`T-Ozet-v1.1.0-Chrome.zip`](release/T-Ozet-v1.1.0-Chrome.zip) · [`T-Ozet-v1.1.0-Firefox.xpi`](release/T-Ozet-v1.1.0-Firefox.xpi)
> 🧪 Kaynak paket: [`T-Ozet-v1.1.0-Source.zip`](release/T-Ozet-v1.1.0-Source.zip)

---

## 🧭 Kullanım

| Yöntem | Nasıl? |
|---|---|
| 🖱️ Seçim balonu | Metni seç → `⚡ Özetle` balonuna tıkla |
| ⌨️ Kısayol | `Alt + S` |
| 🖱️ Sağ tık — seçim | `Bu Kısmı T-Özet ile Özetle` |
| 🖱️ Sağ tık — sayfa | `Tüm Haberi T-Özet ile Özetle` |
| 🎯 Popup | `BU SAYFAYI ÖZETLE` veya `GEMINI POPUP AÇ` |

### Buton öğretimi

Ayarlar → **BUTON ÖĞRETİMİ** üç satırdan oluşur:

| Satır | Ne öğretir? |
|---|---|
| **GİZLİ SEÇ** | Gemini'deki Geçici Sohbet / gizli mod butonu |
| **GÖNDER BUTONU** | Gemini'deki gönder butonu |
| **AI SEÇ** | Gemini'deki model seçici butonu |

Akış çok basit:

1. İlgili satırda **ÖĞREN**'e bas.
2. Gemini Google sayfası açılır.
3. Yukarıdaki çubuktan hedefi seçip **ÖĞRET**'e bas (Ayarlar'dan açıldığında hedef zaten seçili gelir).
4. Gemini sayfasında ilgili yerlere **sen tıklarsın** — birden fazla buton seçebilirsin.
5. Seçilenler beyaz çerçeveyle gösterilir; **ÖĞRET**'e bastığında hepsi kaydedilir. İmza listesi olarak saklanır.

**ÇOKLU SEÇİM:** İstediğin satırları işaretle, tek **ÖĞREN** ile Gemini'yi aç. Çubukta seçili hedefler aynı anda görünür; her butonu seçip **OK**'a bastıkça sıradaki hedefe geçer.

Ayarlar'da test/sıfırlama veya model seçici yoktur; her şey elle yapılır.

### Gemini öğretim çubuğu

| Kontrol | İşlev |
|---|---|
| **GİZLİ** | Geçici Sohbet hedefi |
| **GÖNDER** | Gönder butonu hedefi |
| **AI SEÇ** | Model seçici hedefi |
| **ÖĞRET** | Öğretimi başlat; seçilen adayları kaydet |
| **×** | Çubuğu gizle |

Varsayılan akış tamamen manuel. Gemini yanıtı gerektiren otomatik analiz yoktur.

---

## 🧩 Proje yapısı

| Dosya / klasör | Görev |
|---|---|
| `manifest.json` | MV3 tanımı, izinler, content script eşleşmeleri |
| `theme.css` | Nothing Design token'ları + ortak buton ailesi |
| `popup/` | Şablon seçici, hızlı özet butonları |
| `options/` | Şablonlar, popup konumu, buton öğretimi |
| `background/service-worker.js` | Sağ tık menüleri, popup penceresi, test mesajları |
| `content/content.js` | Seçim balonu, kısayol, prompt üretimi |
| `content/readability.js` | DOM metni ayıklama + temizleme |
| `content/gemini-autofill.js` | Geçici Sohbet, prompt yazımı, gönderim, öğretim çubuğu |
| `content/content.css` | Sayfa içi balon/kart stilleri |
| `offscreen/` | DOMParser ile HTML temizleme belgesi |
| `icons/` | 16 / 48 / 128 px ikonlar |
| `docs/screenshots/` | Bu sayfadaki görseller |

> `lib/` klasöründeki yerel WebGPU/Transformers.js denemesi **v1.1'de kullanılmaz**.
> Kaynak olarak durur; pakete dahil edilmez.

---

## 🔐 İzinler

Kurulumda **yalnızca gerekenler** istenir. `<all_urls>` ile statik content script yoktur.

| İzin | Tür | Neden gerekli? |
|---|---|---|
| `activeTab` | Zorunlu | Eklenti simgesine tıklandığında o sekmeye geçici erişim |
| `storage` | Zorunlu | Şablon, popup konumu ve buton imzaları |
| `contextMenus` | Zorunlu | Sağ tık menüleri |
| `scripting` | Zorunlu | Sayfa script'ini gerektiğinde injection |
| `webNavigation` | Zorunlu | SPA geçişlerinde erken injection |
| `system.display` | Zorunlu | Popup'ı aktif ekrana sığdırma |
| `offscreen` | Zorunlu | DOMParser ile HTML temizleme |
| `clipboardWrite` | **İsteğe bağlı** | İlk panoya kopyalamada sorulur |
| `host: gemini.google.com` | Zorunlu | Gemini otomasyonu |
| `optional_host_permissions` | **İsteğe bağlı** | Gelecekte domain bazlı izin için ayrılmış; kurulumda verilmez |

> Sayfa script'i yalnızca eklenti simgesine tıklayınca veya sağ tık menüsünden tetiklenir.
> Kurulumda "tüm sitelerdeki verileri oku/değiştir" uyarısı çıkmaz.

---

## 🛡️ Gizlilik ve güvenlik

### Kısa cevap

> [!IMPORTANT]
> 🔒 Özetler kaydedilmez, telemetri gönderilmez, uzaktan güncelleme alınmaz.
> ⚠️ "Sıfır kayıt" = Gemini **Geçici Sohbet**. İçerik yine Google tarafından işlenir.

| Endişe | Cevap |
|---|---|
| 📤 Verilerim nereye gidiyor? | Sayfanın DOM metni (en fazla 40.000 karakter) ve seçtiğin şablonun prompt'u **`gemini.google.com`** adresine gider. Başka bir sunucu yok. |
| 🗑️ Özetler kaydediliyor mu? | Eklenti **özet geçmişi tutmaz**. Gemini'de **Geçici Sohbet** açılır; özet etkinlik kaydına yazılmaz. |
| ⚠️ "Sıfır kayıt" ne demek? | Geçici Sohbet demektir. İçerik yine Google tarafından işlenir; bu bir **çevrimdışı** eklenti değildir. |
| 🔄 Otomatik güncelleme var mı? | **Hayır.** Eklenti kendini güncellemez, dışarıdan update/config çekmez, uzaktan kod indirmez. Güncelleme yalnızca sen dosyaları değiştirip elle yüklediğinde olur. |
| 📊 Telemetri / analitik? | **Yok.** Kullanım istatistiği, hata raporu, kimlik takibi gönderilmez. |
| 🔤 Fontlar dışarıdan mı? | Evet, `fonts.googleapis.com` / `fonts.gstatic.com` üzerinden. Engellenirse sistem fontlarına düşer. Tamamen yerel istersen font `<link>` satırlarını kaldırmak yeterli. |
| 💾 Yerel veriler nerede? | Şablon, popup konumu ve öğretilen buton imzaları yalnızca tarayıcının `storage.local` alanında tutulur. |
| 🔐 İzinler | `activeTab`, `storage`, `contextMenus`, `scripting` + Gemini host izni zorunlu; `clipboardWrite` ve site izinleri isteğe bağlı. `<all_urls>` statik izni yok. |

### Ağ trafiği

| Hedef | Neden | Zorunlu mu? |
|---|---|---|
| `https://gemini.google.com/*` | Prompt'u yazıp göndermek | ✅ Evet — özetleme için gerekli |
| `https://fonts.googleapis.com`, `https://fonts.gstatic.com` | Doto / Space Grotesk / Space Mono | ❌ Hayır — fallback var, engellenebilir |

> **Özet:** Eklenti dışarıdan kendiliğinden güncelleme almaz. Tek zorunlu dış bağlantı Gemini'dir. Font isteği isteğe bağlıdır ve kapatılabilir.

---

## 🎨 Tasarım

**Nothing Design** sistemi, koyu mod özelinde uygulandı:

| Token | Değer |
|---|---|
| Zemin | `#000000` |
| Kart | `#111111` |
| Kenarlık | `#222222` / `#333333` |
| Birincil metin | `#E8E8E8` |
| Vurgu (tek nokta) | `#D71921` |
| Başarı | `#4A9E5C` |

Fontlar Google Fonts üzerinden yüklenir: **Doto** (display), **Space Grotesk** (UI),
**Space Mono** (etiket/veri). Çevrimdışında sistem fallback'leri devreye girer.

---

## 🧪 Doğrulama

v1.1 arayüzü **Brave 158** üzerinde test edildi:

- ✅ `theme.css`, fontlar ve tüm yerel kaynaklar HTTP 200
- ✅ Sürüm `1.1.0`, rozet `V1.1 / DARK`
- ✅ Gölge yok, pill butonlar, doğru renk token'ları
- ✅ Doto / Space Grotesk / Space Mono yüklendi
- ✅ 8 şablon, 3 öğretim satırı, aktif kart durumu

---

## 🗺 Yol haritası

| Fikir | Durum |
|---|---|
| 🧾 Özeti Gemini'den geri alıp kopyala / `.md` indir | Planlandı |
| 🕘 Özet geçmişi | Planlandı |
| 🌐 Site başına varsayılan şablon | Planlandı |
| ⌨️ Kısayol ayarları (`commands`) | Planlandı |
| 📄 PDF / YouTube transkript desteği | Planlandı |
| 🤖 Yerel AI fallback (eski `lib/` motoru) | Beklemede |

---

## 📝 Changelog

Detaylar: [`CHANGELOG.md`](CHANGELOG.md)

---

## 🤖 AI katkısı

Bu proje yapay zeka ile birlikte geliştirildi:

| Aşama | Araç | Katkı |
|---|---|---|
| 🧱 İlk geliştirme | **Gemini** (Google Antigravity) | Eklentinin ana mimarisi, Gemini otomasyonu, prompt şablonları, popup ve Ayarlar altyapısı, ilk sürümler |
| 🔧 Son rötuşlar | **HY4** (OpenCode) | v1.1 Nothing Design teması, doğrudan DOM çıkarımı, Ayarlar'dan buton öğretimi, Brave testleri, temiz paketleme ve bu tanıtım sayfası |

> İnsan yönlendirmesi: **Taroxzen** — kararlar, testler ve son onay.

---

## 📄 Lisans

[GPL-3.0](LICENSE) — Taroxzen

---

<div align="center">

| 🎯 **T-Özet** | 🧠 Gemini ile başladı | 🔧 HY4 ile bitti | 👤 Taroxzen imzası |
|:---:|:---:|:---:|:---:|
| sade metin | net karar | sıfır gösteriş | 📄 GPL-3.0 |

</div>
