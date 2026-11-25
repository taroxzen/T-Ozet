# 📝 Changelog

## v1.1.0 — 21.11.2026

### 🎨 Tam tema değişimi

- Nothing Design sistemi geçirildi: OLED siyah zemin, düz yüzeyler, gölge yok.
- Doto / Space Grotesk / Space Mono fontları eklendi.
- Popup, Ayarlar, Gemini öğretim çubuğu ve sayfa içi kart stilleri yenilendi.
- Tüm butonlar tek ailede toplandı: primary / secondary / ghost / destructive.

### 🧠 İçerik çıkarımı

- Siteye özel seçiciler kaldırıldı.
- Sayfa HTML/DOM metni doğrudan alınıyor (40.000 karakter sınırı).

### 🎯 Buton öğretimi

- Öğretim kontrolleri Ayarlar sekmesine taşındı.
- Geçici Sohbet ve Gönder butonları ayrı ayrı öğretiliyor.
- Test Et ve Sıfırla eylemleri eklendi.
- Gönder otomasyonu öğretilen imzayı önce kullanıyor.

### 🧹 Temizlik

- Sürüm 1.1.0'a yükseltildi.
- README tam tanıtım sayfası olarak yeniden yazıldı.
- Gizlilik metni gerçek davranışla uyumlu hale getirildi.
- Kullanılmayan yerel AI motoru paket dışında bırakıldı.
- AI katkısı README'ye eklendi: ana geliştirme **Gemini**, son rötuşlar **HY4**.
- Gizlilik SSS eklendi: veri akışı, otomatik güncelleme olmadığı ve font isteğinin isteğe bağlı olduğu açıklandı.
- Tarayıcı izinleri sıkılaştırıldı: `<all_urls>` content script kaldırıldı, `scripting` eklendi, `clipboardWrite` isteğe bağlı yapıldı.
- Ayarlar'a **Site İzinleri** paneli eklendi; domain bazlı izin verme/kaldırma.
- `web_accessible_resources` kaldırıldı; seçim balonu ikonu inline SVG'ye geçirildi.
- Yeni izinler eklendi ve kullanıldı: `webNavigation`, `system.display`, `offscreen`.
- Offscreen DOMParser aracı Ayarlar sayfasına eklendi; çoklu monitör clamp ve SPA injection eklendi.
- Buton öğretimine **MANUEL / AI OTO** modu ve **OK** onayı eklendi.
- Yan panel gereksiz bulunup kaldırıldı.
- Gemini öğretim çubuğu Nothing Design ile yeniden düzenlendi: kırmızı durum noktası, teknik 4px köşe, ayrılmış etiket/durum, belirgin OK butonu.
- AI ÖĞRETİMİ artık Gemini modellerini kullanıyor: Flash / Pro / Flash-Lite seçici, DOM analizi ve OK onayı; Gemini yanıtı yoksa sezgisel fallback.
- Gemini çubuğuna **GİZLİ / GÖNDER / ÖĞRET / AI SEÇ** kontrolleri eklendi; varsayılan akış manuel seçim.
- DOM çıkarımı `article → main → [role=main] → body` önceliğiyle iyileştirildi; `birgun.net` Brave testinde menü/footer gürültüsü kalktı.
- BUTON ÖĞRETİMİ bölümü **ÖĞREN / GİZLİ-HIDDEN / GÖNDER / AI SEÇME** parçalarıyla açıkça düzenlendi.
- Paketleme hatası düzeltildi: zip girişleri `/` ile oluşturuluyor; Brave'de `content?gemini-autofill.js` bozuk dosya adı oluşmuyordu.
- Doğrudan yükleme için `Chrome-Unpacked` klasörü eklendi; zip gerekmez.
- Ayarlar sadeleştirildi: Site İzinleri kartı ve ÖĞREN/TEST ET/SIFIRLA satırları kaldırıldı.
- BUTON ÖĞRETİMİ üç seçime indirgendi: AI SEÇME, GİZLİ MOD SEÇ, GÖNDER BUTONU SEÇ.
- GİZLİ AÇ / GÖNDER AÇ butonları eklendi; seçim sonrası OK onayı zorunlu.
- AI SEÇ artık modeli doğrudan değiştirmez; OK ile onaylanır.
- BUTON ÖĞRETİMİ sıfırdan tasarlandı: GİZLİ SEÇ / GÖNDER BUTONU / AI SEÇ satırları, her birinde tek **ÖĞREN**.
- Ayarlar'daki seçiciler kaldırıldı; akıştamamen manuel: ÖĞREN → Gemini → elle seç → OK.
- Brave popup hatası düzeltildi: `system.display.workArea` `x/y` yerine `left/top` döndürdüğünde konum `NaN` oluyordu; popup yerine normal sekme açılıyordu.
- ÖĞREN butonları artık service worker mesajı yerine `chrome.windows.create` ile doğrudan popup açıyor; başarısız olursa sekmeye düşüyor.
- Çoklu seçim eklendi: GİZLİ / GÖNDER / AI hedefleri işaretlenip tek seferde öğretilebiliyor; OK sonrası sıradaki hedefe geçiliyor.
- AI ve gönder hedef etiketleri düzeltildi.
- Gemini sayfasında çoklu tıklama eklendi: birden fazla buton seçilip tek OK ile imza listesi olarak kaydediliyor.
- ÖĞREN butonlarının yanına SIFIRLA eklendi; ilgili imza anında siliniyor.
- Kritik MV3 hatası düzeltildi: `background.scripts` yerine `background.service_worker` kullanılıyor; service worker artık yükleniyor.
- Popup ve ÖĞREN işlemleri service worker mesajına bağımlı olmaktan çıkarıldı; doğrudan `chrome.windows.create` / `chrome.scripting` kullanılıyor.
- `chrome.runtime.lastError` kaynaklı konsol hataları bastırıldı.
- Gemini çubuğu iki satıra düzenlendi: GİZLİ / GÖNDER / ÖĞRET üstte, AI SEÇ altta; sürükleme alanı büyütüldü.
- 8 prompt şablonu popup'tan kaldırıldı; yalnızca Ayarlar → PROMPT ŞABLONLARI'nda gösteriliyor. Popup sadeleşti.
- Gemini çubuğundan OK kaldırıldı; çoklu tıklamadan sonra ÖĞRET ile kaydediliyor. Düzen istenen formata getirildi.
- Aktif şablon seçicisi Ayarlar'da popup ile aynı buton düzeninde gösteriliyor ve senkron çalışıyor.

---

## v1.0.0

- İlk sürüm: Gemini tabanlı özetleme, 8 şablon, sağ tık menüleri, popup konum ayarları.
