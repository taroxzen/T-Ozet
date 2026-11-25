/**
 * Gemini Web Otomatik Doldurucu & Ayarlar Üzerinden Buton Öğretimi (T-Özet • Taroxzen)
 * İki ayrı öğretim hedefi: geçici sohbet butonu ve gönder butonu.
 */
(() => {
  const alreadyActive = window.__geminiAutofillActive === true;
  window.__geminiAutofillActive = true;

  let hasSubmitted = false;
  let isTeachingMode = false;
  let hoveredElement = null;
  let tempChatActivated = false;
  let teachingTarget = null;
  let teachingMode = 'manual';
  let candidateElement = null;
  let learningTarget = null;
  let selectedTarget = 'tempChat';
  let activeTargets = [];
  let pendingCandidates = [];
  let hiddenMode = 'temporary';
  let sendMode = 'auto';
  let teachSession = null;
  let myTabId = null;

  const validTarget = t => t === 'tempChat' || t === 'send' || t === 'model';

  function isFreshSession(session) {
    return !!(session && Array.isArray(session.targets) && session.targets.length &&
      Date.now() - (session.ts || 0) < 90000);
  }

  function getMyTabId() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: 'WHO_AM_I' }, (res) => {
          if (chrome.runtime.lastError) return resolve(null);
          resolve(res && res.tabId ? res.tabId : null);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function clearTeachSession() {
    await chrome.storage.local.remove(['teachSession', 'teachingTarget', 'teachingTargets']);
  }

  async function applyTeachSession(session) {
    if (!myTabId) myTabId = await getMyTabId();
    teachSession = isFreshSession(session) ? session : null;

    const allowed = teachSession && teachSession.tabId === myTabId;
    if (!allowed || !teachSession.targets.some(validTarget)) {
      stopTeaching();
      removeTeachingBar();
      return;
    }

    activeTargets = teachSession.targets.filter(validTarget);
    if (document.getElementById('t-ozet-teaching-bar')) {
      refreshBarTargets();
      return;
    }

    selectedTarget = activeTargets[0];
    injectDraggableTeachingBar();
    startTeaching(selectedTarget);
    refreshBarTargets();
  }

  // Çubuk yalnızca Ayarlar'dan ÖĞREN ile açılan Gemini penceresinde görünür.
  chrome.storage.local.get(['teachSession', 'teachingMode', 'hiddenMode', 'sendMode', 'pendingLearnRequest'], async (res) => {
    teachingMode = res.teachingMode === 'ai' ? 'ai' : 'manual';
    hiddenMode = res.hiddenMode || 'temporary';
    sendMode = res.sendMode || 'auto';

    await applyTeachSession(res.teachSession);

    if (!alreadyActive) {
      if (res.pendingLearnRequest && Date.now() - (res.pendingLearnRequest.time || 0) < 90000) {
        await prepareLearnPrompt(res.pendingLearnRequest);
      }
      runAutofillSequence();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.teachSession) applyTeachSession(changes.teachSession.newValue);
    if (changes.teachingMode) teachingMode = changes.teachingMode.newValue === 'ai' ? 'ai' : 'manual';
    if (changes.hiddenMode) hiddenMode = changes.hiddenMode.newValue || 'temporary';
    if (changes.sendMode) sendMode = changes.sendMode.newValue || 'auto';
    if (changes.pendingLearnRequest && !alreadyActive) {
      const req = changes.pendingLearnRequest.newValue;
      if (req && Date.now() - (req.time || 0) < 90000) {
        prepareLearnPrompt(req).then(() => runAutofillSequence());
      }
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TEST_TEACHED_BUTTON') {
      testTeachedButton(request.target).then(ok => sendResponse({ ok }));
      return true;
    }
  });

  async function runAutofillSequence() {
    if (hasSubmitted) return;

    try {
      const data = await chrome.storage.local.get([
        'pendingGeminiPrompt',
        'pendingPromptTime',
        'learnedTempChatSignature'
      ]);

      const promptText = data.pendingGeminiPrompt;
      const promptTime = data.pendingPromptTime || 0;

      if (!promptText || (Date.now() - promptTime > 90000)) {
        return;
      }

      await chrome.storage.local.remove(['pendingGeminiPrompt', 'pendingPromptTime']);
      console.log("⚡ T-Özet: Otomatik özetleme dizisi başlatıldı...");

      updateBarStatus("[TARA] GEÇİCİ SOHBET", "#FFFFFF");

      let tempAttempts = 0;
      const maxTempAttempts = 30;

      if (hiddenMode === 'off') {
        tempChatActivated = true;
        updateBarStatus('[GİZLİ] KAPALI', '#999999');
      }

      const tempInterval = hiddenMode === 'off' ? null : setInterval(async () => {
        tempAttempts++;

        const success = await triggerLearnedOrAutoTempChat(data.learnedTempChatSignature);
        if (success) {
          tempChatActivated = true;
          clearInterval(tempInterval);
          updateBarStatus("[OK] GEÇİCİ SOHBET", "#4A9E5C");
          console.log("🔒 T-Özet: Geçici Sohbet başarıyla aktif edildi!");
        }

        if (tempAttempts >= maxTempAttempts) {
          clearInterval(tempInterval);
          console.log("⏱️ T-Özet: Geçici sohbet tarama süresi doldu, metin yazımına geçiliyor.");
        }
      }, 200);

      let inputAttempts = 0;
      const maxInputAttempts = 60;

      const inputInterval = setInterval(() => {
        inputAttempts++;

        const inputEl = document.querySelector(
          'rich-textarea p, rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"], div.ql-editor, textarea'
        );

        if (inputEl && !hasSubmitted && (tempChatActivated || inputAttempts > 10)) {
          hasSubmitted = true;
          clearInterval(inputInterval);
          clearInterval(tempInterval);

          updateBarStatus("[GÖNDER] İSTEM YAZILIYOR", "#FFFFFF");

          setTimeout(() => {
            const currentInput = document.querySelector('rich-textarea p, rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"], textarea') || inputEl;
            typeAndSubmit(currentInput, promptText);
            if (learningTarget) watchGeminiResponse(learningTarget);
          }, 450);
        }

        if (inputAttempts >= maxInputAttempts) {
          clearInterval(inputInterval);
          clearInterval(tempInterval);
        }
      }, 250);

    } catch (err) {
      console.error("Autofill Hatası:", err);
    }
  }

  function updateBarStatus(text, color) {
    const statusSpan = document.getElementById('t-ozet-teach-status');
    if (statusSpan) {
      statusSpan.innerText = text;
      if (color) statusSpan.style.color = color;
    }
  }

  /** Tam sentetik tıklama (Pointer/Mouse dizisi + Scroll) */
  function fullSyntheticClick(el) {
    if (!el) return false;
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };

      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));

      if (typeof el.click === 'function') {
        el.click();
      }

      console.log("🎯 T-Özet: Hedef öğeye tam sentetik tıklama yapıldı ->", el);

      setTimeout(autoConfirmDialog, 200);
      setTimeout(autoConfirmDialog, 500);
      return true;
    } catch (e) {
      console.error("Tıklama hatası:", e);
      return false;
    }
  }

  function autoConfirmDialog() {
    try {
      const dialogs = document.querySelectorAll('mat-dialog-container, [role="dialog"], .mat-mdc-dialog-container, div.dialog');
      dialogs.forEach(dialog => {
        const buttons = Array.from(dialog.querySelectorAll('button, [role="button"]'));
        const confirmBtn = buttons.find(b => {
          const t = (b.innerText || '').toLowerCase();
          const a = (b.getAttribute('aria-label') || '').toLowerCase();
          return t.includes('geçici') || t.includes('tamam') || t.includes('aç') || t.includes('devam') ||
                 a.includes('geçici') || a.includes('confirm') || a.includes('continue');
        });
        if (confirmBtn) {
          confirmBtn.click();
          console.log("🔒 T-Özet: Açılır diyalog onaylandı!");
        }
      });
    } catch (e) {}
  }

  /** Kaydedilen imzayı sayfada bulup tıklar. */
  function triggerSignature(signature) {
    const list = Array.isArray(signature) ? signature : signature ? [signature] : [];
    for (const item of list) {
      if (triggerSingleSignature(item)) return true;
    }
    return false;
  }

  function triggerSingleSignature(signature) {
    if (!signature) return false;

    const allClickables = Array.from(document.querySelectorAll(
      'button, [role="button"], mat-slide-toggle, mat-button-toggle, a, div[tabindex], mat-icon, span'
    ));

    if (signature.ariaLabel) {
      const found = allClickables.find(el => {
        const a = el.getAttribute('aria-label');
        return a && a.toLowerCase().includes(signature.ariaLabel.toLowerCase());
      });
      if (found) return fullSyntheticClick(found.closest('button, [role="button"], mat-slide-toggle') || found);
    }

    if (signature.text) {
      const found = allClickables.find(el => {
        const t = (el.innerText || '').trim().toLowerCase();
        return t === signature.text.toLowerCase() || (t.includes(signature.text.toLowerCase()) && t.length < 50);
      });
      if (found) return fullSyntheticClick(found.closest('button, [role="button"], mat-slide-toggle') || found);
    }

    if (signature.iconName) {
      const found = allClickables.find(el => {
        const icon = el.querySelector('mat-icon') || (el.tagName.toLowerCase() === 'mat-icon' ? el : null);
        if (!icon) return false;
        const name = icon.getAttribute('data-mat-icon-name') || icon.innerText || '';
        return name.trim().toLowerCase() === signature.iconName.toLowerCase();
      });
      if (found) return fullSyntheticClick(found.closest('button, [role="button"], mat-slide-toggle') || found);
    }

    if (signature.dataTestId) {
      const found = allClickables.find(el => el.getAttribute('data-test-id') === signature.dataTestId);
      if (found) return fullSyntheticClick(found.closest('button, [role="button"], mat-slide-toggle') || found);
    }

    if (signature.selector) {
      try {
        const el = document.querySelector(signature.selector);
        if (el) return fullSyntheticClick(el);
      } catch (e) {}
    }

    return false;
  }

  async function triggerLearnedOrAutoTempChat(signature) {
    return triggerSignature(signature) || autoScanTempChat();
  }

  async function triggerLearnedOrAutoSend(signature) {
    return triggerSignature(signature) || autoScanSend();
  }

  async function testTeachedButton(target) {
    const key = target === 'send' ? 'learnedSendSignature' : target === 'model' ? 'learnedModelSignature' : 'learnedTempChatSignature';
    const data = await chrome.storage.local.get([key]);
    if (!data[key]) return false;
    return triggerSignature(data[key]);
  }

  function autoScanTempChat() {
    const allButtons = Array.from(document.querySelectorAll('button, [role="button"], mat-slide-toggle, mat-icon'));
    const tempChatBtn = allButtons.find(b => {
      const a = (b.getAttribute('aria-label') || '').toLowerCase();
      const t = (b.innerText || '').toLowerCase();
      const icon = b.querySelector('mat-icon') || (b.tagName.toLowerCase() === 'mat-icon' ? b : null);
      const iconName = icon ? (icon.getAttribute('data-mat-icon-name') || icon.innerText || '').toLowerCase() : '';

      return a.includes('geçici') || a.includes('temporary') || a.includes('etkinliği kapat') ||
             t.includes('geçici sohbet') || t.includes('temporary chat') ||
             iconName.includes('history_off') || iconName.includes('visibility_off');
    });

    if (tempChatBtn) {
      const parentBtn = tempChatBtn.closest('button, [role="button"], mat-slide-toggle') || tempChatBtn;
      const isPressed = parentBtn.getAttribute('aria-pressed') === 'true' ||
                        parentBtn.classList.contains('active') ||
                        parentBtn.getAttribute('aria-checked') === 'true';
      if (!isPressed) return fullSyntheticClick(parentBtn);
    }
    return false;
  }

  function autoScanSend() {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const sendBtn = allButtons.find(b => {
      const label = (b.getAttribute('aria-label') || '').toLowerCase();
      const isSendClass = b.className.includes('send-button') || b.className.includes('submit');
      const hasArrow = b.innerHTML.includes('arrow_upward') || b.innerHTML.includes('send') || b.innerHTML.includes('M2.01');
      return !b.disabled && (label.includes('gönder') || label.includes('send') || isSendClass || hasArrow);
    });
    return sendBtn ? fullSyntheticClick(sendBtn) : false;
  }

  /** Nothing Design stilleri — Gemini sayfasına dış font yüklenmez. */
  function injectTeachingStyles() {
    if (document.getElementById('t-ozet-teaching-style')) return;
    const style = document.createElement('style');
    style.id = 't-ozet-teaching-style';
    style.textContent = `
      #t-ozet-teaching-bar {
        position: fixed;
        bottom: 16px;
        left: 20px;
        z-index: 2147483647;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        background: #000000;
        border: 1px solid #333333;
        border-radius: 4px;
        padding: 8px 12px;
        font-family: "Space Mono", "JetBrains Mono", "SF Mono", monospace;
        font-size: 10px;
        line-height: 1.2;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #E8E8E8;
        user-select: none;
      }
      #t-ozet-teaching-bar .nd-targets {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      #t-ozet-teaching-bar .nd-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #t-ozet-teaching-bar .nd-row:last-child { justify-content: center; }
      #t-ozet-teaching-bar .nd-divider {
        width: 1px;
        align-self: stretch;
        background: #333333;
      }
      #t-ozet-teaching-bar .nd-drag-zone {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        margin: -4px -4px -4px -8px;
        cursor: grab;
        border-radius: 4px;
      }
      #t-ozet-teaching-bar .nd-drag-zone:hover { background: #111111; }
      #t-ozet-teaching-bar .nd-handle {
        font-size: 14px;
        letter-spacing: -3px;
        color: #666666;
        line-height: 1;
      }
      #t-ozet-teaching-bar .nd-dot {
        width: 6px;
        height: 6px;
        flex: 0 0 6px;
        background: #D71921;
        border-radius: 50%;
      }
      #t-ozet-teaching-bar .nd-label { color: #FFFFFF; }
      #t-ozet-teaching-bar .nd-status {
        color: #999999;
        padding-left: 10px;
        border-left: 1px solid #333333;
        max-width: 260px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #t-ozet-teaching-bar .nd-target,
      #t-ozet-teaching-bar .nd-action {
        background: transparent;
        border: 1px solid #333333;
        color: #999999;
      }
      #t-ozet-teaching-bar .nd-target.active {
        background: #FFFFFF;
        color: #000000;
        border-color: #FFFFFF;
      }
      #t-ozet-teaching-bar .nd-action {
        border-color: #FFFFFF;
        color: #FFFFFF;
      }
      #t-ozet-teaching-bar .nd-target:hover { color: #FFFFFF; border-color: #FFFFFF; }
      #t-ozet-teaching-bar .nd-action:hover { background: #FFFFFF; color: #000000; }

      #t-ozet-teaching-bar button {
        font-family: inherit;
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        border-radius: 999px;
        min-height: 24px;
        padding: 2px 10px;
        transition: color 0.18s ease-out, border-color 0.18s ease-out, background-color 0.18s ease-out;
      }
      #t-ozet-close-bar {
        background: transparent;
        border: 1px solid transparent;
        color: #666666;
        padding: 2px 6px;
      }
      #t-ozet-close-bar:hover { color: #FFFFFF; border-color: #333333; }
      .t-ozet-candidate {
        outline: 2px solid #FFFFFF !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeTeachingBar() {
    const bar = document.getElementById('t-ozet-teaching-bar');
    if (bar) bar.remove();
  }

  /** Status çubuğu: öğretim Ayarlar sekmesinden başlatılır. */
  function injectDraggableTeachingBar() {
    if (document.getElementById('t-ozet-teaching-bar')) return;

    injectTeachingStyles();

    const bar = document.createElement('div');
    bar.id = 't-ozet-teaching-bar';

    bar.innerHTML = `
      <span class="nd-drag-zone" id="t-ozet-drag-handle" title="Sürükle">
        <span class="nd-handle">⋮⋮</span>
        <span class="nd-dot" aria-hidden="true"></span>
        <span class="nd-label">T-ÖZET</span>
      </span>
      <span class="nd-divider"></span>
      <span class="nd-targets">
        <span class="nd-row">
          <button class="nd-target active" id="t-ozet-target-tempChat" title="Geçici Sohbet butonunu seç">GİZLİ</button>
          <button class="nd-target" id="t-ozet-target-send" title="Gönder butonunu seç">GÖNDER</button>
        </span>
        <span class="nd-row">
          <button class="nd-target" id="t-ozet-target-model" title="AI seç butonunu seç">AI SEÇ</button>
        </span>
      </span>
      <span class="nd-divider"></span>
      <button class="nd-action" id="t-ozet-teach-start" title="Seçimleri kaydet / öğretimi başlat">ÖĞRET</button>
      <span id="t-ozet-teach-status" class="nd-status">ÖĞRETİM BEKLENİYOR</span>
      <button id="t-ozet-close-bar" title="Gizle">×</button>
    `;

    const host = document.body || document.documentElement;
    if (!host) return;
    host.appendChild(bar);

    const closeBtn = document.getElementById('t-ozet-close-bar');
    const dragHandle = document.getElementById('t-ozet-drag-handle');
    const targetBtns = [
      document.getElementById('t-ozet-target-tempChat'),
      document.getElementById('t-ozet-target-send'),
      document.getElementById('t-ozet-target-model')
    ];
    const startBtn = document.getElementById('t-ozet-teach-start');

    if (closeBtn) closeBtn.onclick = () => { exitTeachingMode(); };
    if (startBtn) {
      startBtn.onclick = async () => {
        if (isTeachingMode && pendingCandidates.length) {
          await savePendingCandidates();
          return;
        }
        startTeaching(selectedTarget);
      };
    }
    targetBtns.forEach(btn => {
      if (!btn) return;
      btn.onclick = () => {
        const t = btn.id.includes('model') ? 'model' : btn.id.endsWith('send') ? 'send' : 'tempChat';
        if (!activeTargets.includes(t)) activeTargets.push(t);
        selectedTarget = t;
        clearCandidateHighlight();
        
        refreshBarTargets();
        const label = t === 'model' ? 'AI SEÇ' : t === 'send' ? 'GÖNDER' : 'GİZLİ';
        updateBarStatus(`[HEDEF] ${label} — ÖĞRET`, '#FFFFFF');
      };
    });
    if (dragHandle) makeElementDraggable(bar, dragHandle);
  }

  function makeElementDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDrag;
      document.onmousemove = dragElement;
      handle.style.cursor = 'grabbing';
    };

    function dragElement(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = Math.max(5, element.offsetTop - pos2) + "px";
      element.style.left = Math.max(5, element.offsetLeft - pos1) + "px";
      element.style.right = 'auto';
    }

    function closeDrag() {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.cursor = 'grab';
    }
  }

  function startTeaching(target) {
    if (isTeachingMode && teachingTarget === target) return;
    stopTeaching();
    teachingTarget = target;
    selectedTarget = target;
    isTeachingMode = true;
    candidateElement = null;
    
    refreshBarTargets();

    const label = target === 'send'
      ? 'GÖNDER BUTONU'
      : target === 'model'
        ? 'AI MODEL SEÇİCİ'
        : 'GEÇİCİ SOHBET BUTONU';
    updateBarStatus(`[ÖĞRET] ${label}`, '#FFFFFF');

    document.addEventListener('mouseover', onElementHover, true);
    document.addEventListener('mouseout', onElementOut, true);
    document.addEventListener('click', onElementClickCapture, true);
    document.addEventListener('keydown', onKeyDown, true);

    if (teachingMode === 'ai') runAIDetection(target);
  }

  function refreshBarTargets() {
    const defs = [
      ['t-ozet-target-tempChat', 'tempChat'],
      ['t-ozet-target-send', 'send'],
      ['t-ozet-target-model', 'model']
    ];
    defs.forEach(([id, target]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', activeTargets.includes(target));
    });
  }

  /** Gemini modeline "butonu bul" sorusu gönderir. */
  async function prepareLearnPrompt(req) {
    const target = req.target === 'send' ? 'send' : 'tempChat';
    learningTarget = target;

    const hint = req.model === 'pro'
      ? 'Detaylı analiz yap.'
      : req.model === 'lite'
        ? 'Çok kısa ve net cevap ver.'
        : 'Hızlı ve net analiz yap.';

    const wanted = target === 'send'
      ? 'GÖNDER butonu'
      : target === 'model'
        ? 'AI MODEL SEÇİCİ butonu'
        : 'GEÇİCİ SOHBET (Temporary chat) butonu';

    const nodes = Array.from(document.querySelectorAll(
      'button, [role="button"], mat-slide-toggle, mat-button-toggle, a, mat-icon'
    )).slice(0, 140);

    const dump = nodes.map((el, i) => {
      const aria = (el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 120);
      const icon = el.querySelector('mat-icon');
      const iconName = icon ? (icon.getAttribute('data-mat-icon-name') || icon.innerText || '') : '';
      return `[${i}] <${el.tagName.toLowerCase()}> aria="${aria}" text="${text}" class="${cls}" icon="${iconName}"`;
    }).join('\n').slice(0, 25000);

    const prompt = `GÖREV: Bu Gemini sayfasındaki ${wanted} öğesini bul. ${hint}

Aşağıdaki sayfa öğelerini incele. SADECE şu üç satırı döndür, başka açıklama yazma:

SECICI: <geçerli bir CSS selector veya bulunamadıysa />
ARIA: <aria-label değeri veya yoksa />
METIN: <görünen metin veya yoksa />

ÖĞELER:
${dump}

Türkçe cevap:`;

    await chrome.storage.local.set({
      pendingGeminiPrompt: prompt,
      pendingPromptTime: Date.now()
    });
    await chrome.storage.local.remove('pendingLearnRequest');
    updateBarStatus('[AI] GEMINI ANALİZ EDİYOR', '#FFFFFF');
  }

  function parseLearnResponse(text) {
    if (!text) return null;
    const pick = (label) => {
      const m = text.match(new RegExp(label + ':\\s*([^\\n]+)', 'i'));
      if (!m) return '';
      return m[1]
        .replace(/^["'`\s]+|["'`\s.]+$/g, '')
        .replace(/^\/?>\s*/, '')
        .trim()
        .slice(0, 300);
    };

    const selector = pick('SECICI');
    const ariaLabel = pick('ARIA');
    const labelText = pick('METIN');
    if (!selector && !ariaLabel && !labelText) return null;
    return { selector, ariaLabel, text: labelText };
  }

  function applyLearnedSignature(target, parsed) {
    const signature = {
      name: (parsed.ariaLabel || parsed.text || 'AI ÖĞRENEN BUTON').substring(0, 30),
      ariaLabel: parsed.ariaLabel || '',
      text: parsed.text || '',
      iconName: '',
      dataTestId: '',
      tag: '',
      selector: parsed.selector.startsWith('/') ? '' : parsed.selector
    };

    let el = null;
    try {
      if (signature.selector) el = document.querySelector(signature.selector);
    } catch (e) {}
    if (!el && signature.ariaLabel) {
      el = Array.from(document.querySelectorAll('button, [role="button"], mat-icon'))
        .find(n => (n.getAttribute('aria-label') || '').toLowerCase().includes(signature.ariaLabel.toLowerCase()));
    }
    if (!el && signature.text) {
      el = Array.from(document.querySelectorAll('button, [role="button"], a'))
        .find(n => (n.innerText || '').trim().toLowerCase().includes(signature.text.toLowerCase()));
    }

    if (!el) {
      updateBarStatus('[AI] GEMINI ADAYP BULAMADI — SEZGISSEL', '#999999');
      runAIDetection(target);
      return;
    }

    clearCandidateHighlight();
    candidateElement = el;
    candidateElement.classList.add('t-ozet-candidate');
    updateBarStatus('[AI] GEMINI ADAYP BULUNDU — ÖĞRET', '#4A9E5C');
    
    console.log('🤖 T-Özet Gemini AI öğrenen aday:', signature);
  }

  function watchGeminiResponse(target) {
    let attempts = 0;
    let lastText = '';
    const timer = setInterval(() => {
      attempts++;

      const responses = document.querySelectorAll('model-response, .response-container');
      if (responses.length) {
        const el = responses[responses.length - 1];
        const body = el.querySelector('.message-text') || el;
        const txt = (body.innerText || body.textContent || '').trim();
        if (txt.length > lastText.length) lastText = txt;

        const parsed = parseLearnResponse(lastText);
        if (parsed) {
          clearInterval(timer);
          applyLearnedSignature(target, parsed);
          return;
        }
      }

      if (attempts >= 150) {
        clearInterval(timer);
        updateBarStatus('[AI] GEMINI YANIT YOK — SEZGISSEL', '#999999');
        runAIDetection(target);
      }
    }, 400);
  }

  /** Gemini sayfası değişse de çalışan sezgisel aday taraması. */
  function runAIDetection(target) {
    const nodes = Array.from(document.querySelectorAll(
      'button, [role="button"], mat-slide-toggle, mat-button-toggle, a, mat-icon'
    ));

    const scored = nodes.map(el => ({ el, score: scoreCandidate(el, target) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) {
      updateBarStatus('[AI] ADAYP YOK — MANUEL TIKLA', '#999999');
      return;
    }

    clearCandidateHighlight();
    candidateElement = scored[0].el;
    candidateElement.classList.add('t-ozet-candidate');
    updateBarStatus('[AI] ADAYP BULUNDU — ÖĞRET', '#4A9E5C');
    
  }

  function scoreCandidate(el, target) {
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    const text = (el.innerText || '').trim().toLowerCase();
    const icon = el.querySelector('mat-icon') || (el.tagName.toLowerCase() === 'mat-icon' ? el : null);
    const iconName = icon ? ((icon.getAttribute('data-mat-icon-name') || icon.innerText || '').toLowerCase()) : '';
    const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();

    let score = 0;
    if (target === 'send') {
      if (aria.includes('gönder') || aria.includes('send')) score += 5;
      if (cls.includes('send-button') || cls.includes('submit')) score += 4;
      if (iconName.includes('arrow_upward') || iconName.includes('send')) score += 4;
      if ((el.innerHTML || '').includes('arrow_upward')) score += 3;
    } else if (target === 'model') {
      if (aria.includes('model') || text.includes('model')) score += 5;
      if (text.includes('flash') || text.includes('pro') || text.includes('gemini')) score += 4;
      if (cls.includes('model') || cls.includes('picker')) score += 3;
    } else {
      if (aria.includes('geçici') || aria.includes('temporary')) score += 5;
      if (text.includes('geçici sohbet') || text.includes('temporary chat')) score += 5;
      if (aria.includes('etkinliği kapat') || aria.includes('activity')) score += 3;
      if (iconName.includes('history_off') || iconName.includes('visibility_off')) score += 4;
    }
    return score;
  }

  function stopTeaching() {
    if (!isTeachingMode) return;
    isTeachingMode = false;
    teachingTarget = null;
    activeTargets = [];
    
    clearCandidateHighlight();
    clearHighlight();

    document.removeEventListener('mouseover', onElementHover, true);
    document.removeEventListener('mouseout', onElementOut, true);
    document.removeEventListener('click', onElementClickCapture, true);
    document.removeEventListener('keydown', onKeyDown, true);
  }

  async function exitTeachingMode() {
    stopTeaching();
    removeTeachingBar();
    await clearTeachSession();
  }

  function onElementHover(e) {
    if (!isTeachingMode) return;
    if (e.target.closest('#t-ozet-teaching-bar')) return;

    clearHighlight();
    hoveredElement = e.target.closest('button, [role="button"], mat-slide-toggle, mat-button-toggle, a, mat-icon') || e.target;
    if (hoveredElement) hoveredElement.classList.add('t-ozet-candidate');
  }

  function onElementOut(e) {
    if (!isTeachingMode) return;
    clearHighlight();
  }

  function clearHighlight() {
    if (hoveredElement) {
      hoveredElement.classList.remove('t-ozet-candidate');
      hoveredElement = null;
    }
  }

  function clearCandidateHighlight() {
    if (candidateElement) {
      candidateElement.classList.remove('t-ozet-candidate');
      candidateElement = null;
    }
    pendingCandidates.forEach(el => el.classList.remove('t-ozet-candidate'));
    pendingCandidates = [];
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && isTeachingMode) {
      exitTeachingMode();
    }
  }

  async function onElementClickCapture(e) {
    if (!isTeachingMode) return;
    if (e.target.closest('#t-ozet-teaching-bar')) return;

    // Sayfanın kendi davranışı korunur: model seçici açılır, butonlar çalışır.
    const targetEl = e.target.closest('button, [role="button"], mat-slide-toggle, mat-button-toggle, a') || e.target;
    clearHighlight();
    pendingCandidates.push(targetEl);
    targetEl.classList.add('t-ozet-candidate');
    updateBarStatus(`[${pendingCandidates.length}] ADAYP — ÖĞRET İLE KAYDET`, '#4A9E5C');
  }

  function keyForTarget(target) {
    return target === 'send'
      ? 'learnedSendSignature'
      : target === 'model'
        ? 'learnedModelSignature'
        : 'learnedTempChatSignature';
  }

  async function savePendingCandidates() {
    if (!pendingCandidates.length && candidateElement) pendingCandidates = [candidateElement];
    if (!pendingCandidates.length) return;

    const targets = activeTargets.length ? activeTargets : [teachingTarget].filter(Boolean);
    let count = 0;

    for (let i = 0; i < pendingCandidates.length; i++) {
      const el = pendingCandidates[i];
      const target = targets.length > 1 ? targets[i % targets.length] : (targets[0] || selectedTarget);
      const key = keyForTarget(target);
      const signature = extractElementSignature(el);

      const data = await chrome.storage.local.get([key]);
      const prev = data[key];
      const list = Array.isArray(prev) ? prev.slice() : prev ? [prev] : [];
      list.push(signature);
      await chrome.storage.local.set({ [key]: list.slice(-8) });
      count++;
    }

    pendingCandidates.forEach(el => el.classList.remove('t-ozet-candidate'));
    pendingCandidates = [];
    candidateElement = null;
    updateBarStatus(`[OK] ${count} ADAYP KAYDEDİLDİ`, '#4A9E5C');
    await clearTeachSession();
    stopTeaching();
    removeTeachingBar();
  }

  async function saveTeachedSignature(targetEl) {
    if (!targetEl || !teachingTarget) return;

    const signature = extractElementSignature(targetEl);
    const key = teachingTarget === 'send'
      ? 'learnedSendSignature'
      : teachingTarget === 'model'
        ? 'learnedModelSignature'
        : 'learnedTempChatSignature';

    await chrome.storage.local.set({ [key]: signature });
    console.log("💾 T-Özet öğrenilen buton:", key, signature);

    setTimeout(() => fullSyntheticClick(targetEl), 100);

    const idx = activeTargets.indexOf(teachingTarget);
    if (idx >= 0) activeTargets.splice(idx, 1);

    if (activeTargets.length) {
      selectedTarget = activeTargets[0];
      teachingTarget = selectedTarget;
      clearCandidateHighlight();
      refreshBarTargets();
      const label = selectedTarget === 'model' ? 'AI SEÇ' : selectedTarget === 'send' ? 'GÖNDER' : 'GİZLİ';
      updateBarStatus(`[OK] KAYDEDİLDİ · SIRADAKİ: ${label}`, '#4A9E5C');
      return;
    }

    updateBarStatus('[OK] KAYDEDİLDİ', '#4A9E5C');
    await clearTeachSession();
    stopTeaching();
    removeTeachingBar();
  }

  function extractElementSignature(el) {
    const ariaLabel = el.getAttribute('aria-label') || '';
    const text = (el.innerText || '').trim();
    const dataTestId = el.getAttribute('data-test-id') || '';

    let iconName = '';
    const icon = el.querySelector('mat-icon') || (el.tagName.toLowerCase() === 'mat-icon' ? el : null);
    if (icon) {
      iconName = icon.getAttribute('data-mat-icon-name') || icon.innerText || '';
    }

    let selector = '';
    try {
      if (el.id && typeof CSS !== 'undefined' && CSS.escape) {
        selector = '#' + CSS.escape(el.id);
      } else if (dataTestId && typeof CSS !== 'undefined' && CSS.escape) {
        selector = '[data-test-id="' + CSS.escape(dataTestId) + '"]';
      }
    } catch (_) {}

    const name = ariaLabel || text || iconName || 'Öğretilen Buton';

    return {
      name: name.substring(0, 30),
      ariaLabel: ariaLabel.trim(),
      text: text.trim(),
      iconName: iconName.trim(),
      dataTestId: dataTestId.trim(),
      tag: el.tagName.toLowerCase(),
      selector: selector
    };
  }

  async function typeAndSubmit(inputEl, text) {
    if (!inputEl) return;
    inputEl.focus();

    if (inputEl.tagName === 'TEXTAREA') {
      inputEl.value = text;
    } else {
      inputEl.innerText = text;
    }

    inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    setTimeout(async () => {
      let ok = false;

      if (sendMode !== 'enter') {
        const data = await chrome.storage.local.get(['learnedSendSignature']);
        ok = await triggerLearnedOrAutoSend(data.learnedSendSignature);
      }

      if (!ok) {
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      }

      updateBarStatus("[OK] GÖNDERİLDİ", "#4A9E5C");
      console.log(ok ? "🚀 T-Özet: Gönder butonuna tıklandı!" : "🚀 T-Özet: Enter ile gönderildi!");
    }, 300);
  }
})();
