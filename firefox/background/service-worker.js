/**
 * Background Service Worker - T-Özet (Taroxzen)
 * Sekmeye Bağlı Otomatik Kapanma (Tab-Linked Auto-Close) & Tekil Pencere Yönetimi
 */

const tabToPopupMap = new Map();

// Tarayıcı / PC her yeniden başladığında eski kalıntı popup pencerelerini temizle
chrome.runtime.onStartup.addListener(async () => {
  cleanupGeminiPopups();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['popupWidth', 'popupHeight', 'popupLeft', 'popupTop'], (res) => {
    const defaultW = 540;
    const defaultH = 760;
    if (!res.popupWidth) chrome.storage.local.set({ 
      popupWidth: defaultW, 
      popupHeight: defaultH,
      popupLeft: 50,
      popupTop: 60
    });
  });

  createContextMenus();
  cleanupGeminiPopups();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'gemini-summarize-selection',
      title: '⚡ Bu Kısmı T-Özet ile Özetle (Popup)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'gemini-summarize-page',
      title: '📰 Tüm Haberi T-Özet ile Özetle (Popup)',
      contexts: ['page']
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'gemini-summarize-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'CONTEXT_MENU_SUMMARIZE_SELECTION',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'gemini-summarize-page') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'CONTEXT_MENU_SUMMARIZE_PAGE'
    });
  }
});

// ÖZETLENEN ANA SEKME KAPANDIĞINDA BAĞLI POPUP PENCERESİNİ DE OTOMATİK KAPAT
chrome.tabs.onRemoved.addListener(async (closedTabId) => {
  if (tabToPopupMap.has(closedTabId)) {
    const popupWinId = tabToPopupMap.get(closedTabId);
    tabToPopupMap.delete(closedTabId);

    try {
      await chrome.windows.remove(popupWinId);
      console.log(`🧹 Özetlenen sekme (${closedTabId}) kapandı, bağlı popup penceresi (${popupWinId}) otomatik kapatıldı!`);
    } catch (e) {}
  }
});

// Popup penceresi kullanıcı tarafından kapatılırsa eşleştirmeyi temizle
chrome.windows.onRemoved.addListener((closedWinId) => {
  for (const [tabId, winId] of tabToPopupMap.entries()) {
    if (winId === closedWinId) {
      tabToPopupMap.delete(tabId);
      break;
    }
  }
});

// Mesaj dinleyici: Küçük popup penceresi aç
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_GEMINI_POPUP') {
    const parentTabId = sender.tab ? sender.tab.id : null;

    openGeminiPopupWindow(request.promptText, parentTabId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("Popup açma hatası:", err);
        chrome.tabs.create({ url: 'https://gemini.google.com/app' });
        sendResponse({ success: true, fallback: true });
      });
    return true;
  }
});

async function cleanupGeminiPopups() {
  try {
    const allWindows = await chrome.windows.getAll({ populate: true });
    for (const win of allWindows) {
      if (win.type === 'popup') {
        const hasGeminiTab = win.tabs && win.tabs.some(t => t.url && t.url.includes('gemini.google.com'));
        if (hasGeminiTab) {
          await chrome.windows.remove(win.id).catch(() => {});
          console.log("🧹 Eski kalıntı Gemini popup penceresi kapatıldı:", win.id);
        }
      }
    }
    tabToPopupMap.clear();
  } catch (e) {
    console.log("Popup temizleme:", e);
  }
}

async function openGeminiPopupWindow(promptText, parentTabId) {
  await cleanupGeminiPopups();

  const prefs = await chrome.storage.local.get(['popupWidth', 'popupHeight', 'popupLeft', 'popupTop']);
  
  const width = Math.round(parseInt(prefs.popupWidth, 10) || 540);
  const height = Math.round(parseInt(prefs.popupHeight, 10) || 760);
  
  let left = 50;
  if (prefs.popupLeft !== undefined && !isNaN(prefs.popupLeft)) {
    left = Math.round(parseInt(prefs.popupLeft, 10));
  }

  let top = 60;
  if (prefs.popupTop !== undefined && !isNaN(prefs.popupTop)) {
    top = Math.round(parseInt(prefs.popupTop, 10));
  }

  const geminiUrl = 'https://gemini.google.com/app';

  try {
    const win = await chrome.windows.create({
      url: geminiUrl,
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top,
      focused: true
    });

    if (win && win.id) {
      if (parentTabId) {
        tabToPopupMap.set(parentTabId, win.id);
      }

      setTimeout(() => {
        chrome.windows.update(win.id, {
          left: left,
          top: top,
          width: width,
          height: height,
          focused: true
        }).catch(() => {});
      }, 80);
    }
  } catch (e) {
    await chrome.tabs.create({ url: geminiUrl });
  }
}