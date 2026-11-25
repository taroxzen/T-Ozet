/** T-Özet v1.1 — Popup: şablonlar Ayarlar'da, burada sadece eylemler. */
document.addEventListener('DOMContentLoaded', () => {
  const btnOptions = document.getElementById('btn-options');
  const btnOpenDirect = document.getElementById('btn-open-gemini-direct');
  const btnSummarizePage = document.getElementById('btn-summarize-page');

  if (btnOptions) {
    btnOptions.addEventListener('click', () => chrome.runtime.openOptionsPage());
  }

  if (btnOpenDirect) {
    btnOpenDirect.addEventListener('click', async () => {
      const prefs = await chrome.storage.local.get(['popupWidth', 'popupHeight', 'popupLeft', 'popupTop']);
      const url = 'https://gemini.google.com/app';
      try {
        await chrome.windows.create({
          url,
          type: 'popup',
          width: parseInt(prefs.popupWidth, 10) || 540,
          height: parseInt(prefs.popupHeight, 10) || 760,
          left: parseInt(prefs.popupLeft, 10) || 50,
          top: parseInt(prefs.popupTop, 10) || 60,
          focused: true
        });
      } catch (e) {
        await chrome.tabs.create({ url });
      }
      window.close();
    });
  }

  if (btnSummarizePage) {
    btnSummarizePage.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/content.css'] }).catch(() => {});
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/readability.js', 'content/content.js']
      }).catch(() => {});
      chrome.tabs.sendMessage(tab.id, { action: 'CONTEXT_MENU_SUMMARIZE_PAGE' }, () => void chrome.runtime.lastError);
      window.close();
    });
  }
});
