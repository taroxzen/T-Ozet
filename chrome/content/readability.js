/**
 * Türkçe Haber ve Forum İçerik Ayıklayıcısı (Boilerplate & Reklam Temizleyici)
 */
class PageContentExtractor {
  static extract() {
    const hostname = window.location.hostname;
    let title = document.title;
    let rawText = '';

    // 1. Başlık Yakalama
    const h1 = document.querySelector('h1');
    if (h1 && h1.innerText.trim().length > 5) {
      title = h1.innerText.trim();
    }

    // 2. Özel Site Kuralları
    if (hostname.includes('sozcu.com.tr')) {
      rawText = this.getTextFromSelectors(['.article-content', '.content-element', 'article']);
    } else if (hostname.includes('hurriyet.com.tr')) {
      rawText = this.getTextFromSelectors(['.news-content', '.article-body', '.rh-news-content']);
    } else if (hostname.includes('birgun.net')) {
      rawText = this.getTextFromSelectors(['.content-text', '.news-detail-content', 'article']);
    } else if (hostname.includes('eksisozluk.com')) {
      rawText = this.getEksiEntries();
    } else if (hostname.includes('donanimhaber.com')) {
      rawText = this.getTextFromSelectors(['.kl-icerik-icerik', '.forum-mesaj', 'article']);
    } else if (hostname.includes('technopat.net')) {
      rawText = this.getTextFromSelectors(['.message-body', '.bbWrapper', 'article']);
    } else if (hostname.includes('reddit.com')) {
      rawText = this.getTextFromSelectors(['shreddit-post', '[data-test-id="post-content"]', '.Post']);
    }

    // 3. Genel Makale Ayıklama
    if (!rawText || rawText.length < 100) {
      rawText = this.getTextFromSelectors([
        'article',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        'main'
      ]);
    }

    // 4. Fallback
    if (!rawText || rawText.length < 100) {
      rawText = document.body ? document.body.innerText : '';
    }

    // 5. Temizleme (Haber sitelerinin telif/iktibas dipnotlarını temizle)
    const cleanedText = this.cleanBoilerplate(rawText);

    return {
      title: title,
      text: cleanedText
    };
  }

  static getTextFromSelectors(selectors) {
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText.trim().length > 80) {
        return el.innerText.trim();
      }
    }
    return '';
  }

  static getEksiEntries() {
    const entries = document.querySelectorAll('#entry-item-list li .content');
    if (!entries || entries.length === 0) return '';
    const texts = [];
    entries.forEach((e, i) => {
      if (i < 8) texts.push(`[Girdi ${i+1}]: ${e.innerText.trim()}`);
    });
    return texts.join('\n\n');
  }

  static cleanBoilerplate(text) {
    if (!text) return '';

    return text
      // Telif ve iktibas metinlerini temizle
      .replace(/ve\s+Rek\.?\s*Tic\.?\s*A\.?Ş\.?'?ye\s+aittir.*$/gims, '')
      .replace(/İzin\s+alınmadan[^\n.]*iktibas\s+edilemez[^\n.]*/gims, '')
      .replace(/Her\s+hakkı\s+saklıdır[^\n.]*/gims, '')
      .replace(/Telif\s+Hakları[^\n.]*/gims, '')
      .replace(/Yasal\s+Uyarı:[^\n.]*/gims, '')
      .replace(/DHA\s*\|\s*İHA\s*\|\s*AA/gims, '')
      .replace(/Abone\s+ol[^\n.]*/gims, '')
      .replace(/Paylaş\s+Tweetle\s+Paylaş/gims, '')
      // Fazla boşlukları toparla
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

window.PageContentExtractor = PageContentExtractor;