# 🔐 Güvenlik politikası

T-Özet, Gemini tabanlı bir tarayıcı eklentisidir. Güvenlik açıklarının sorumlu biçimde bildirilmesini hoş karşılıyoruz.

## Desteklenen sürümler

| Sürüm | Destek |
|---|---|
| 1.1.0 | ✅ Evet |
| 1.0.x | ❌ Hayır — 1.1.0'a yükselt |

## Açık bildirim

**Kamuya açık issue açma.**

- [GitHub üzerinden özel bildirim gönder](https://github.com/taroxzen/T-Ozet/security/advisories/new)
- Gerekirse bakım yazılımcıya ulaş: https://github.com/taroxzen

Bildirime şunları ekle:

1. Etkilenen sürüm ve tarayıcı (Chrome / Brave / Edge / Firefox).
2. Adım adım yeniden üretme.
3. Olası etki: veri sızıntısı, izin aşımı, enjeksiyon, uzaktan kod.
4. Varsa düzeltme önerisi.

Şifre, token veya kişisel veri gönderme.

## Yanıt süresi

| Aşama | Süre |
|---|---|
| İlk yanıt | 72 saat içinde |
| Doğrulama | 7 gün içinde |
| Düzeltme | Ciddiyete göre, genelde 30 gün içinde |

Düzeltme hazır olduğunda yeni bir sürüm ve release yayımlanır; bildirici kredi alabilir.

## Kapsam

- Eklenti kaynak kodu: `Chrome-Unpacked/`, `content/`, `background/`, `options/`, `popup/`, `offscreen/`.
- İzin kullanımı, veri akışı, prompt üretimi, `storage.local` kullanımı.
- Paketleme, manifest ve release asset'leri.

Kapsam dışı:

- Gemini servisinin kendisi ve Google hesabı güvenliği.
- Tarayıcı (Chrome / Brave / Edge / Firefox) güvenlik açıkları.
- Kullanıcının işletim sistemi veya ağı.

## Güvenlik davranışı

- Özet geçmişi tutulmaz; Gemini Geçici Sohbet kullanılır.
- Telemetri, hata raporu veya kimlik takibi gönderilmez.
- Kendiliğinden güncelleme, uzaktan config veya uzaktan kod yoktur.
- `<all_urls>` statik content script izni yoktur; `clipboardWrite` isteğe bağlıdır.
- Tek zorunlu dış bağlantı `gemini.google.com`; font isteği isteğe bağlıdır.

Detaylar: [Gizlilik ve güvenlik](https://github.com/taroxzen/T-Ozet#-gizlilik-ve-güvenlik)
