/**
 * Content Script - Doğrudan ve Hızlı Özetleyici (T-Özet • Taroxzen)
 */
(() => {
  if (window.__tOzetContentActive) return;
  window.__tOzetContentActive = true;

  let activePreset = 'apple';
  let customPromptText = '';
  let currentSelectionText = '';
  let bubbleEl = null;

  const PRESETS = {
    apple: {
      name: '✨ Basit Özet',
      build: (t) => `Sen Apple tarzı minimalist bir metin yazarı ve bilgi damıtıcısısın.
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
"""${t}"""

Türkçe Minimalist Özet:`
    },

    two_words: {
      name: '⚡ 2 Kelimede Flaş',
      build: (t) => `GÖREVİN: Aşağıdaki metni sadece 3 saniyede okunabilecek ultra-kompakt bir flaş habere dönüştür.
KURALLAR:
1. Sıfır dolgu kelimesi. Doğrudan öz.
2. Çıktı mutlaka Türkçe olmalı.
3. ÇIKTI FORMATI:
⚡ 2 Kelimede: [Tam 2 Kelimelik Ana Konu]
💬 Flaş Olay: [Olayı net anlatan tek bir kısa cümle]

Metin:
"""${t}"""

Türkçe Flaş Özet:`
    },

    bullets: {
      name: '📌 Madde Madde',
      build: (t) => `GÖREVİN: Aşağıdaki metindeki tüm gereksiz detayları ayıkla ve olayı sadece 3-5 net madde halinde özetle.
KURALLAR:
1. Her madde tek bir somut bilgiyi anlatsın.
2. Duru ve sade Türkçe kullan.
3. Giriş veya kapanış cümlesi kurma.

ÇIKTI:
📌 [1. Net Madde]
📌 [2. Net Madde]
📌 [3. Net Madde]

Metin:
"""${t}"""

Türkçe Madde Özet:`
    },

    table: {
      name: '📊 Tablo Formatı',
      build: (t) => `GÖREVİN: Aşağıdaki metindeki ana verileri, kişileri, tarihleri, sayıları ve kararları temiz bir Markdown Tablosu halinde özetle.
KURALLAR:
1. Tablo başlıkları: | Konu / Başlık | Detay / Karar | Kim / Ne Zaman? |
2. Tablonun altına sadece 1 satırlık "💡 Sonuç Notu" ekle.
3. Çıktı Türkçe olsun.

Metin:
"""${t}"""

Türkçe Tablo Özet:`
    },

    five_w: {
      name: '📰 5N1K Gazetecilik',
      build: (t) => `GÖREVİN: Aşağıdaki metni gazetecilik standardı olan 5N1K formatında net bir şekilde analiz et.
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
"""${t}"""

Türkçe 5N1K Analiz:`
    },

    eli5: {
      name: '🧒 Basit Anlat (Sıfır Terim)',
      build: (t) => `GÖREVİN: Aşağıdaki karmaşık konuyu sanki 10 yaşındaki bir çocuğa ya da konuyu hiç bilmeyen birine anlatıyormuş gibi en sade, eğlenceli ve anlaşılır dille açıkla.
KURALLAR:
1. Hiçbir teknik, resmi veya süslü terim kullanma.
2. Günlük konuşma diliyle 2-3 kısa paragrafta olayı anlat.
3. En alta "🎈 Kısacası:" diyerek tek cümlelik bir benzetme/özet ekle.

Metin:
"""${t}"""

Sade Türkçe Açıklama:`
    },

    executive: {
      name: '💼 Yönetici Özeti',
      build: (t) => `GÖREVİN: Aşağıdaki metni bir şirket yöneticisi veya karar verici için stratejik bir Yönetici Özeti (Executive Brief) haline getir.
ÇIKTI FORMATI:
🎯 DURUM: [1 Cümlede ana gelişme]
⚠️ RİSKLER & ETKİLER: [Maddeler halinde]
💡 EYLEM / ÖNERİ: [Alınması gereken aksiyon veya sonuç]

Metin:
"""${t}"""

Türkçe Yönetici Özeti:`
    }
  };

  chrome.storage.local.get(['activePreset', 'customPromptText'], (res) => {
    if (res.activePreset) activePreset = res.activePreset;
    if (res.customPromptText) customPromptText = res.customPromptText;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.activePreset) activePreset = changes.activePreset.newValue;
      if (changes.customPromptText) customPromptText = changes.customPromptText.newValue;
    }
  });

  document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';

      if (text.length > 25) {
        currentSelectionText = text;
        showSelectionBubble(e.pageX, e.pageY);
      } else {
        removeSelectionBubble();
      }
    }, 80);
  });

  document.addEventListener('mousedown', (e) => {
    if (bubbleEl && !bubbleEl.contains(e.target)) {
      removeSelectionBubble();
    }
  });

  function showSelectionBubble(x, y) {
    removeSelectionBubble();

    bubbleEl = document.createElement('div');
    bubbleEl.id = 'ai-summarizer-bubble';
    bubbleEl.title = 'Seçilen metni doğrudan özetle';
    const mark = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
      '<rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="#E8E8E8" stroke-width="1.5"/>' +
      '<circle cx="8" cy="8" r="2" fill="#E8E8E8"/></svg>'
    );
    bubbleEl.innerHTML = `
      <img src="${mark}" alt="" class="ai-bubble-icon">
      <span>ÖZETLE</span>
    `;

    document.body.appendChild(bubbleEl);

    const bWidth = 90;
    const bHeight = 30;
    let posX = x + 10;
    let posY = y - bHeight - 10;

    if (posX + bWidth > window.innerWidth + window.scrollX) {
      posX = window.innerWidth + window.scrollX - bWidth - 10;
    }
    if (posY < window.scrollY) {
      posY = y + 20;
    }

    bubbleEl.style.left = `${posX}px`;
    bubbleEl.style.top = `${posY}px`;

    bubbleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSelectionBubble();
      directSummarize(currentSelectionText);
    });
  }

  function removeSelectionBubble() {
    if (bubbleEl) {
      bubbleEl.remove();
      bubbleEl = null;
    }
  }

  async function directSummarize(rawText) {
    if (!rawText || rawText.trim().length === 0) return;

    const prefs = await chrome.storage.local.get(['activePreset', 'customPromptText']);
    const currentPreset = prefs.activePreset || activePreset || 'apple';
    const currentCustom = prefs.customPromptText || customPromptText || '';

    let fullPrompt = '';
    if (currentPreset === 'custom' && currentCustom.trim().length > 0) {
      fullPrompt = `${currentCustom.trim()}\n\nMetin:\n"""${rawText.trim()}"""\n\nTürkçe Yanıt:`;
    } else {
      const presetHandler = PRESETS[currentPreset] || PRESETS.apple;
      fullPrompt = presetHandler.build(rawText.trim());
    }

    await chrome.storage.local.set({ 
      pendingGeminiPrompt: fullPrompt, 
      pendingPromptTime: Date.now() 
    });

    navigator.clipboard.writeText(fullPrompt).catch(() => {});

    chrome.runtime.sendMessage({
      action: 'OPEN_GEMINI_POPUP',
      promptText: fullPrompt
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      const pageData = window.PageContentExtractor ? window.PageContentExtractor.extract() : { text: document.body.innerText };
      directSummarize(pageData.text);
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CONTEXT_MENU_SUMMARIZE_SELECTION') {
      const text = request.text || currentSelectionText;
      if (text) directSummarize(text);
    } else if (request.action === 'CONTEXT_MENU_SUMMARIZE_PAGE') {
      const pageData = window.PageContentExtractor ? window.PageContentExtractor.extract() : { text: document.body.innerText, title: document.title };
      if (pageData.text) directSummarize(pageData.text);
    }
  });
})();