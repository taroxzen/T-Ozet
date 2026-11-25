/**
 * Prompt Şablonları Kataloğu (T-Özet • Taroxzen)
 */
export const PROMPT_PRESETS = {
  apple: {
    id: 'apple',
    name: '✨ Basit Özet',
    shortDesc: '2 Kelime Başlık + 1-2 Cümle Öz + 3 Kritik Bilgi + Kısaca',
    icon: '✨',
    build: (rawText) => `Sen Apple tarzı minimalist bir metin yazarı ve bilgi damıtıcısısın.
GÖREVİN: Aşağıdaki metni analiz et. Metindeki tüm tık tuzaklarını (clickbait), tekrar eden SEO dolgularını, gereksiz uzatmaları ve süslü bürokratik laf kalabalığını TAMAMEN ÇÖPE AT.

KURALLAR:
1. Asla "Bu metinde...", "Özetle...", "Tabii ki..." gibi robotik girişler YAPMA. Doğrudan özü ver.
2. Düz, duru, enerjik ve herkesin ilk bakışta anlayacağı en sade günlük Türkçeyi kullan.
3. Kaynak metin yabancı dilde olsa dahi çıktıyı mutlaka kusursuz ve akıcı Türkçe ver.
4. ÇIKTI FORMATI:
✦ 2 Kelime:
[Tam 2 Kelimelik Vurucu Ana Başlık]

✦ Özet:
[Olayın veya konunun özü, 1 veya en fazla 2 net kısa cümle]

✦ 3 Kritik Bilgi:
• [Kilit 1. Somut Bilgi]
• [Kilit 2. Somut Bilgi]
• [Kilit 3. Somut Bilgi]

✦ Kısaca:
[Okuyucuyu doğrudan ilgilendiren tek satırlık pratik sonuç]

Metin:
"""${rawText}"""

Türkçe Minimalist Özet:`
  },

  two_words: {
    id: 'two_words',
    name: '⚡ 2 Kelimede Flaş',
    shortDesc: '3 saniyede okunur: 2 Kelimelik Etiket + 1 Şimşek Cümle',
    icon: '⚡',
    build: (rawText) => `GÖREVİN: Aşağıdaki metni sadece 3 saniyede okunabilecek ultra-kompakt bir flaş habere dönüştür.
KURALLAR:
1. Sıfır dolgu kelimesi. Doğrudan öz.
2. Çıktı mutlaka Türkçe olmalı.
3. ÇIKTI FORMATI:
⚡ 2 Kelimede: [Tam 2 Kelimelik Ana Konu]
💬 Flaş Olay: [Olayı net anlatan tek bir kısa cümle]

Metin:
"""${rawText}"""

Türkçe Flaş Özet:`
  },

  bullets: {
    id: 'bullets',
    name: '📌 Madde Madde',
    shortDesc: 'Laf kalabalığı atılmış 3-5 adet net madde',
    icon: '📌',
    build: (rawText) => `GÖREVİN: Aşağıdaki metindeki tüm gereksiz detayları ayıkla ve olayı sadece 3-5 net madde halinde özetle.
KURALLAR:
1. Her madde tek bir somut bilgiyi anlatsın.
2. Duru ve sade Türkçe kullan.
3. Giriş veya kapanış cümlesi kurma.

ÇIKTI:
📌 [1. Net Madde]
📌 [2. Net Madde]
📌 [3. Net Madde]

Metin:
"""${rawText}"""

Türkçe Madde Özet:`
  },

  table: {
    id: 'table',
    name: '📊 Tablo Formatı',
    shortDesc: 'Sayılar, kişiler ve kararları temiz Markdown tablosuna döker',
    icon: '📊',
    build: (rawText) => `GÖREVİN: Aşağıdaki metindeki ana verileri, kişileri, tarihleri, sayıları ve kararları temiz bir Markdown Tablosu halinde özetle.
KURALLAR:
1. Tablo başlıkları: | Konu / Başlık | Detay / Karar | Kim / Ne Zaman? |
2. Tablonun altına sadece 1 satırlık "💡 Sonuç Notu" ekle.
3. Çıktı Türkçe olsun.

Metin:
"""${rawText}"""

Türkçe Tablo Özet:`
  },

  five_w: {
    id: 'five_w',
    name: '📰 5N1K Gazetecilik',
    shortDesc: 'Ne? Neden? Nasıl? Nerede? Ne Zaman? Kim?',
    icon: '📰',
    build: (rawText) => `GÖREVİN: Aşağıdaki metni gazetecilik standardı olan 5N1K formatında net bir şekilde analiz et.
KURALLAR:
1. Her soruya sadece 1 kısa ve net cümleyle cevap ver.
2. Çıktı formatı:
🔹 NE OLDU?: [Cevap]
🔹 KİM YAPTI / İLGİLİ?: [Cevap]
🔹 NEDEN OLDU?: [Cevap]
🔹 NASIL GELİŞTİ?: [Cevap]
🔹 NEREDE OLDU?: [Cevap]
🔹 NE ZAMAN?: [Cevap]

Metin:
"""${rawText}"""

Türkçe 5N1K Analiz:`
  },

  eli5: {
    id: 'eli5',
    name: '🧒 Basit Anlat (Sıfır Terim)',
    shortDesc: 'Hiçbir karmaşık terim olmadan en sade konuşma dili',
    icon: '🧒',
    build: (rawText) => `GÖREVİN: Aşağıdaki karmaşık konuyu sanki 10 yaşındaki bir çocuğa ya da konuyu hiç bilmeyen birine anlatıyormuş gibi en sade, eğlenceli ve anlaşılır dille açıkla.
KURALLAR:
1. Hiçbir teknik, resmi veya süslü terim kullanma.
2. Günlük konuşma diliyle 2-3 kısa paragrafta olayı anlat.
3. En alta "🎈 Kısacası:" diyerek tek cümlelik bir benzetme/özet ekle.

Metin:
"""${rawText}"""

Sade Türkçe Açıklama:`
  },

  executive: {
    id: 'executive',
    name: '💼 Yönetici Özeti',
    shortDesc: 'Durum + Riskler/Fırsatlar + Alınacak Aksiyon',
    icon: '💼',
    build: (rawText) => `GÖREVİN: Aşağıdaki metni bir şirket yöneticisi veya karar verici için stratejik bir Yönetici Özeti (Executive Brief) haline getir.
ÇIKTI FORMATI:
🎯 DURUM: [1 Cümlede ana gelişme]
⚠️ RİSKLER & ETKİLER: [Maddeler halinde]
💡 EYLEM / ÖNERİ: [Alınması gereken aksiyon veya sonuç]

Metin:
"""${rawText}"""

Türkçe Yönetici Özeti:`
  },

  custom: {
    id: 'custom',
    name: '✍️ Özel Prompt',
    shortDesc: 'Kendi yazdığınız serbest talimat geçerli olur',
    icon: '✍️',
    build: (rawText, customText) => {
      const prompt = customText && customText.trim().length > 0 ? customText.trim() : 'Aşağıdaki metni Türkçe olarak özetle:';
      return `${prompt}\n\nMetin:\n"""${rawText}"""\n\nTürkçe Yanıt:`;
    }
  }
};