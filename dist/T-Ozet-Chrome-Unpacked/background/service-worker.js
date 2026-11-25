/**
 * Background Service Worker - T-Özet (Taroxzen)
 * İzin bilinciyle content script injection, popup yönetimi, buton testi.
 */

const tabToPopupMap = new Map();
let grantedOrigins = [];
const TEACH_SESSION_MAX_AGE = 90000;

async function getTeachSession() {
  const res = await chrome.storage.local.get('teachSession');
  const session = res.teachSession;
  if (!session || !Array.isArray(session.targets) || !session.targets.length) return null;
  return Date.now() - (session.ts || 0) < TEACH_SESSION_MAX_AGE ? session : null;
}

async function clearTeachSession() {
  await chrome.storage.local.remove(['teachSession', 'teachingTarget', 'teachingTargets']);
}

chrome.runtime.onStartup.addListener(() => {
  clearTeachSession();
  cleanupGeminiPopups();
  refreshGrantedOrigins();
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
  refreshGrantedOrigins();
});

if (chrome.permissions && chrome.permissions.onAdded) {
  chrome.permissions.onAdded.addListener(refreshGrantedOrigins);
  chrome.permissions.onRemoved.addListener(refreshGrantedOrigins);
}
refreshGrantedOrigins();

// SPA geçişlerinde daha erken injection.
if (chrome.webNavigation && chrome.webNavigation.onDOMContentLoaded) {
  chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    if (details.frameId !== 0) return;
    const url = details.url;
    if (!url || !url.startsWith('http') || url.includes('gemini.google.com')) return;
    if (grantedOrigins.some(origin => matchesOrigin(url, origin))) {
      ensurePageScript(details.tabId, url);
    }
  });
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'gemini-summarize-selection',
      title: 'BU KISMI T-ÖZET İLE ÖZETLE',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'gemini-summarize-page',
      title: 'TÜM SAYFAYI T-ÖZET İLE ÖZETLE',
      contexts: ['page']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  await ensurePageScript(tab.id, tab.url);

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

// İzin verilmiş sitelerde yeni sayfa açılınca script'i hazırla.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (!tab.url.startsWith('http') || tab.url.includes('gemini.google.com')) return;
  if (grantedOrigins.some(origin => matchesOrigin(tab.url, origin))) {
    ensurePageScript(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener(async (closedTabId) => {
  const session = await getTeachSession();
  if (session && session.tabId === closedTabId) await clearTeachSession();

  if (tabToPopupMap.has(closedTabId)) {
    const popupWinId = tabToPopupMap.get(closedTabId);
    tabToPopupMap.delete(closedTabId);
    try { await chrome.windows.remove(popupWinId); } catch (e) {}
  }
});

chrome.windows.onRemoved.addListener(async (closedWinId) => {
  const session = await getTeachSession();
  if (session && session.windowId === closedWinId) await clearTeachSession();

  for (const [tabId, winId] of tabToPopupMap.entries()) {
    if (winId === closedWinId) {
      tabToPopupMap.delete(tabId);
      break;
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'WHO_AM_I') {
    sendResponse({ tabId: sender.tab ? sender.tab.id : null });
    return false;
  }

  if (request.action === 'START_TEACH') {
    (async () => {
      const targets = Array.isArray(request.targets)
        ? request.targets.filter(t => t === 'tempChat' || t === 'send' || t === 'model')
        : [];
      if (!targets.length) {
        sendResponse({ ok: false });
        return;
      }

      await clearTeachSession();
      await chrome.storage.local.set({ teachingMode: request.mode === 'ai' ? 'ai' : 'manual' });

      const session = {
        token: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        targets,
        ts: Date.now(),
        tabId: null,
        windowId: null
      };

      const created = await createTeachWindow();
      session.tabId = created.tabId;
      session.windowId = created.windowId;
      await chrome.storage.local.set({ teachSession: session });
      sendResponse({ ok: true });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (request.action === 'END_TEACH') {
    clearTeachSession()
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (request.action === 'OPEN_GEMINI_POPUP') {
    const parentTabId = sender.tab ? sender.tab.id : null;

    openGeminiPopupWindow(request.promptText, parentTabId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('Popup açma hatası:', err);
        chrome.tabs.create({ url: 'https://gemini.google.com/app' });
        sendResponse({ success: true, fallback: true });
      });
    return true;
  }

  if (request.action === 'ENSURE_PAGE_SCRIPT') {
    ensurePageScript(request.tabId)
      .then(ok => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (request.action === 'SITE_PERMISSION_GRANTED') {
    refreshGrantedOrigins();
    chrome.tabs.query({ url: request.origin }, (tabs) => {
      tabs.forEach(t => ensurePageScript(t.id, t.url));
    });
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === 'CLEAN_HTML') {
    (async () => {
      try {
        await ensureOffscreenDocument();
        chrome.runtime.sendMessage(
          { action: 'OFFSCREEN_CLEAN_HTML', html: request.html || '' },
          (res) => sendResponse(res || { ok: false, text: '' })
        );
      } catch (e) {
        sendResponse({ ok: false, text: '' });
      }
    })();
    return true;
  }

  if (request.action === 'TEST_TEACHED_BUTTON') {
    chrome.tabs.query({ url: 'https://gemini.google.com/*' }, (tabs) => {
      if (!tabs.length) {
        sendResponse({ ok: false });
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'TEST_TEACHED_BUTTON', target: request.target },
        (res) => sendResponse({ ok: !!(res && res.ok) })
      );
    });
    return true;
  }
});

async function refreshGrantedOrigins() {
  try {
    const all = await chrome.permissions.getAll();
    grantedOrigins = (all.origins || []).filter(o => o !== 'https://gemini.google.com/*');
  } catch (e) {
    grantedOrigins = [];
  }
}

function matchesOrigin(url, pattern) {
  const base = pattern.replace(/\/\*$/, '');
  if (base.endsWith('://*')) return url.startsWith(base.replace('*', ''));
  return url.startsWith(base);
}

async function ensureClipboardPermission() {
  try {
    const status = await chrome.permissions.contains({ permissions: ['clipboardWrite'] });
    if (!status) await chrome.permissions.request({ permissions: ['clipboardWrite'] });
  } catch (e) {}
}

async function ensurePageScript(tabId, url) {
  if (!tabId) return false;
  try {
    if (url && (!url.startsWith('http') || url.includes('gemini.google.com'))) return false;
    await ensureClipboardPermission();
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content/content.css']
    }).catch(() => {});
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/readability.js', 'content/content.js']
    });
    return true;
  } catch (e) {
    return false;
  }
}

let offscreenCreating = null;

async function ensureOffscreenDocument() {
  try {
    const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existing.length) return;
    if (offscreenCreating) return offscreenCreating;

    offscreenCreating = chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Ham HTML metnini DOMParser ile temizlemek için geçici belge gerekir.'
    }).finally(() => { offscreenCreating = null; });

    return offscreenCreating;
  } catch (e) {}
}

async function clampToDisplay(left, top, width, height) {
  try {
    const displays = await chrome.system.display.getInfo();
    const display = displays.find(d => d.isPrimary) || displays[0];
    if (!display || !display.workArea) return { left, top };

    const area = display.workArea;
    // Chrome x/y kullanır; Brave bazı sürümlerde left/top döndürür.
    const x = (area.x !== undefined ? area.x : area.left) || 0;
    const y = (area.y !== undefined ? area.y : area.top) || 0;
    return {
      left: Math.max(x, Math.min(left, x + area.width - width)),
      top: Math.max(y, Math.min(top, y + area.height - height))
    };
  } catch (e) {
    return { left, top };
  }
}

async function cleanupGeminiPopups() {
  try {
    const allWindows = await chrome.windows.getAll({ populate: true });
    for (const win of allWindows) {
      if (win.type === 'popup') {
        const hasGeminiTab = win.tabs && win.tabs.some(t => t.url && t.url.includes('gemini.google.com'));
        if (hasGeminiTab) await chrome.windows.remove(win.id).catch(() => {});
      }
    }
    tabToPopupMap.clear();
  } catch (e) {}
}

async function createTeachWindow() {
  await cleanupGeminiPopups();

  const prefs = await chrome.storage.local.get(['popupWidth', 'popupHeight', 'popupLeft', 'popupTop']);
  const width = Math.round(parseInt(prefs.popupWidth, 10) || 540);
  const height = Math.round(parseInt(prefs.popupHeight, 10) || 760);
  let left = prefs.popupLeft !== undefined && !isNaN(prefs.popupLeft) ? Math.round(parseInt(prefs.popupLeft, 10)) : 50;
  let top = prefs.popupTop !== undefined && !isNaN(prefs.popupTop) ? Math.round(parseInt(prefs.popupTop, 10)) : 60;
  ({ left, top } = await clampToDisplay(left, top, width, height));
  const geminiUrl = 'https://gemini.google.com/app';

  try {
    const win = await chrome.windows.create({
      url: geminiUrl,
      type: 'popup',
      width,
      height,
      left,
      top,
      focused: true
    });

    let tabId = win && win.tabs && win.tabs[0] && win.tabs[0].id;
    if (!tabId && win && win.id) {
      const tabs = await chrome.tabs.query({ windowId: win.id });
      tabId = tabs[0] && tabs[0].id;
    }

    if (win && win.id) {
      setTimeout(() => {
        chrome.windows.update(win.id, { left, top, width, height, focused: true }).catch(() => {});
      }, 80);
    }

    return { tabId: tabId || null, windowId: win && win.id ? win.id : null };
  } catch (e) {
    const tab = await chrome.tabs.create({ url: geminiUrl });
    return { tabId: tab.id || null, windowId: tab.windowId || null };
  }
}

async function openGeminiPopupWindow(promptText, parentTabId) {
  await cleanupGeminiPopups();

  const prefs = await chrome.storage.local.get(['popupWidth', 'popupHeight', 'popupLeft', 'popupTop']);
  const width = Math.round(parseInt(prefs.popupWidth, 10) || 540);
  const height = Math.round(parseInt(prefs.popupHeight, 10) || 760);
  let left = prefs.popupLeft !== undefined && !isNaN(prefs.popupLeft) ? Math.round(parseInt(prefs.popupLeft, 10)) : 50;
  let top = prefs.popupTop !== undefined && !isNaN(prefs.popupTop) ? Math.round(parseInt(prefs.popupTop, 10)) : 60;
  ({ left, top } = await clampToDisplay(left, top, width, height));
  const geminiUrl = 'https://gemini.google.com/app';

  try {
    const win = await chrome.windows.create({
      url: geminiUrl,
      type: 'popup',
      width,
      height,
      left,
      top,
      focused: true
    });

    if (win && win.id) {
      if (parentTabId) tabToPopupMap.set(parentTabId, win.id);
      setTimeout(() => {
        chrome.windows.update(win.id, { left, top, width, height, focused: true }).catch(() => {});
      }, 80);
    }
  } catch (e) {
    await chrome.tabs.create({ url: geminiUrl });
  }
}
