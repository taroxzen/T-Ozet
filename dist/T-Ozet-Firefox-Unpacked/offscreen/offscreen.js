/**
 * Offscreen document — DOMParser ile ham HTML'den temiz metin çıkarır.
 * Service worker'da DOM bulunmadığı için bu belge kullanılır.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'OFFSCREEN_CLEAN_HTML') return false;

  try {
    const doc = new DOMParser().parseFromString(request.html || '', 'text/html');
    doc.querySelectorAll('script, style, noscript, svg, iframe').forEach(el => el.remove());

    const raw = (doc.body && (doc.body.innerText || doc.body.textContent)) || '';
    const text = raw
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 40000);

    sendResponse({ ok: true, text });
  } catch (e) {
    sendResponse({ ok: false, text: '' });
  }
  return true;
});
