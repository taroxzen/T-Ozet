/**
 * Doğrudan DOM İçerik Ayıklayıcısı (T-Özet • Taroxzen)
 * Siteye özel seçici yok. Sayfanın HTML/DOM metnini doğrudan alır.
 */
class PageContentExtractor {
  static MAX_CHARS = 40000;

  static extract() {
    const title = this.getTitle();
    const candidates = [
      document.querySelector('article'),
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.body,
      document.documentElement
    ];
    const root = candidates.find(el => el && (el.innerText || '').trim().length > 100) ||
                 document.body || document.documentElement;
    let text = root ? root.innerText : '';

    // innerText boşsa DOM metnine düş.
    if (!text || text.trim().length < 20) {
      text = document.documentElement ? document.documentElement.textContent : '';
    }

    return {
      title: title,
      text: this.clean(text)
    };
  }

  static getTitle() {
    const h1 = document.querySelector('h1');
    if (h1 && h1.innerText && h1.innerText.trim().length > 5) {
      return h1.innerText.trim();
    }
    return document.title || '';
  }

  static clean(text) {
    if (!text) return '';

    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, this.MAX_CHARS);
  }
}

window.PageContentExtractor = PageContentExtractor;
