/**
 * Gemini Web Otomatik Doldurucu & Dayanıklı Buton Öğretici (T-Özet • Taroxzen)
 * Asenkron Angular Yükleme Uyumlu + Sürekli Dinleme & Gözlem Motoru
 */
(() => {
  if (window.__geminiAutofillActive) return;
  window.__geminiAutofillActive = true;

  let hasSubmitted = false;
  let isTeachingMode = false;
  let hoveredElement = null;
  let tempChatActivated = false;

  // 1. Sürüklenebilir Öğretici Çubuğu Ekle
  injectDraggableTeachingBar();

  // 2. Otomatik Prompt Gönderimi (Asenkron Güvenli Sıralama)
  runAutofillSequence();

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

      updateBarStatus("🔍 Geçici sohbet butonu taranıyor...", "#38bdf8");

      // 1. ADIM: Geçici Sohbet Butonunu Asenkron Olarak Ara ve Kesinlikle Tıkla (6 saniye boyunca dene)
      let tempAttempts = 0;
      const maxTempAttempts = 30;

      const tempInterval = setInterval(async () => {
        tempAttempts++;

        const success = await triggerLearnedOrAutoTempChat(data.learnedTempChatSignature);
        if (success) {
          tempChatActivated = true;
          clearInterval(tempInterval);
          updateBarStatus("🔒 Geçici Sohbet Açıldı!", "#4ade80");
          console.log("🔒 T-Özet: Geçici Sohbet başarıyla aktif edildi!");
        }

        if (tempAttempts >= maxTempAttempts) {
          clearInterval(tempInterval);
          console.log("⏱️ T-Özet: Geçici sohbet tarama süresi doldu, metin yazımına geçiliyor.");
        }
      }, 200);

      // 2. ADIM: Metin Giriş Kutusunu Bekle ve Geçici Sohbet Tetiklendikten Sonra Yaz
      let inputAttempts = 0;
      const maxInputAttempts = 60;

      const inputInterval = setInterval(() => {
        inputAttempts++;

        const inputEl = document.querySelector(
          'rich-textarea p, rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"], div.ql-editor, textarea'
        );

        // Giriş kutusu hazır ve ya geçici sohbet açıldı ya da bekleme süresi makul bir seviyeye ulaştı
        if (inputEl && !hasSubmitted && (tempChatActivated || inputAttempts > 10)) {
          hasSubmitted = true;
          clearInterval(inputInterval);
          clearInterval(tempInterval);

          updateBarStatus("✍️ İstem yazılıyor ve gönderiliyor...", "#38bdf8");

          setTimeout(() => {
            const currentInput = document.querySelector('rich-textarea p, rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"], textarea') || inputEl;
            typeAndSubmit(currentInput, promptText);
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

  /**
   * Tam Sentetik Tıklama (Pointer/Mouse Dizisi + Scroll)
   */
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

      // Onay pencerelerini kontrol et
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

  /**
   * Öğrenilen Buton İmzasını Sayfada Arayıp Tıklar
   */
  async function triggerLearnedOrAutoTempChat(signature) {
    const allClickables = Array.from(document.querySelectorAll(
      'button, [role="button"], mat-slide-toggle, mat-button-toggle, a, div[tabindex], mat-icon, span'
    ));

    if (signature) {
      // 1. Aria-Label Eşleşmesi
      if (signature.ariaLabel && signature.ariaLabel.length > 0) {
        const found = allClickables.find(el => {
          const a = el.getAttribute('aria-label');
          return a && a.toLowerCase().includes(signature.ariaLabel.toLowerCase());
        });
        if (found) {
          const btn = found.closest('button, [role="button"], mat-slide-toggle') || found;
          return fullSyntheticClick(btn);
        }
      }

      // 2. Metin İçeriği Eşleşmesi
      if (signature.text && signature.text.length > 0) {
        const found = allClickables.find(el => {
          const t = (el.innerText || '').trim().toLowerCase();
          return t === signature.text.toLowerCase() || (t.includes(signature.text.toLowerCase()) && t.length < 50);
        });
        if (found) {
          const btn = found.closest('button, [role="button"], mat-slide-toggle') || found;
          return fullSyntheticClick(btn);
        }
      }

      // 3. İkon Adı Eşleşmesi
      if (signature.iconName && signature.iconName.length > 0) {
        const found = allClickables.find(el => {
          const icon = el.querySelector('mat-icon') || (el.tagName.toLowerCase() === 'mat-icon' ? el : null);
          if (!icon) return false;
          const name = icon.getAttribute('data-mat-icon-name') || icon.innerText || '';
          return name.trim().toLowerCase() === signature.iconName.toLowerCase();
        });
        if (found) {
          const btn = found.closest('button, [role="button"], mat-slide-toggle') || found;
          return fullSyntheticClick(btn);
        }
      }

      // 4. CSS Seçici Eşleşmesi
      if (signature.selector) {
        try {
          const el = document.querySelector(signature.selector);
          if (el) return fullSyntheticClick(el);
        } catch (e) {}
      }
    }

    // Yedek Akıllı Otomatik Tarama
    return autoScanTempChat();
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
      if (!isPressed) {
        return fullSyntheticClick(parentBtn);
      }
    }
    return false;
  }

  /**
   * SÜRÜKLENEBİLİR VE CANLI TEST BUTONLU ÖĞRETİCİ ÇUBUK
   */
  function injectDraggableTeachingBar() {
    if (document.getElementById('t-ozet-teaching-bar')) return;

    const bar = document.createElement('div');
    bar.id = 't-ozet-teaching-bar';
    bar.style.cssText = `
      position: fixed;
      top: 14px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 7px;
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid rgba(56, 189, 248, 0.4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      border-radius: 20px;
      padding: 4px 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11.5px;
      color: #f8fafc;
      user-select: none;
      backdrop-filter: blur(12px);
    `;

    bar.innerHTML = `
      <span id="t-ozet-drag-handle" style="cursor: grab; color: #94a3b8; font-size: 13px; padding: 0 2px;" title="Sürükle">⋮⋮</span>
      <span style="color: #38bdf8; font-weight: bold;">🎯 T-Özet:</span>
      <button id="t-ozet-teach-btn" style="
        background: #2563eb;
        border: none;
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10.5px;
        font-weight: 600;
        cursor: pointer;
      ">👆 Butonu Öğret</button>
      <button id="t-ozet-test-btn" style="
        background: #0f172a;
        border: 1px solid #334155;
        color: #38bdf8;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10.5px;
        font-weight: 600;
        cursor: pointer;
        display: none;
      " title="Kaydedilen butonu şimdi tıkla">▶️ Test Et</button>
      <span id="t-ozet-teach-status" style="font-size: 10.5px; color: #94a3b8;">(Geçici Sohbet Butonunu Seç)</span>
      <button id="t-ozet-close-bar" style="
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 13px;
        cursor: pointer;
        padding: 0 4px;
      " title="Gizle">✕</button>
    `;

    document.body.appendChild(bar);

    const teachBtn = document.getElementById('t-ozet-teach-btn');
    const testBtn = document.getElementById('t-ozet-test-btn');
    const statusSpan = document.getElementById('t-ozet-teach-status');
    const closeBtn = document.getElementById('t-ozet-close-bar');
    const dragHandle = document.getElementById('t-ozet-drag-handle');

    closeBtn.onclick = () => bar.remove();

    teachBtn.onclick = () => {
      if (isTeachingMode) {
        exitTeachingMode();
      } else {
        enterTeachingMode();
      }
    };

    testBtn.onclick = async () => {
      statusSpan.innerText = '⏳ Buton aranıyor...';
      const data = await chrome.storage.local.get(['learnedTempChatSignature']);
      const ok = await triggerLearnedOrAutoTempChat(data.learnedTempChatSignature);
      if (ok) {
        statusSpan.innerText = '✅ Test Başarılı (Tıklandı)!';
        statusSpan.style.color = '#4ade80';
      } else {
        statusSpan.innerText = '⚠️ Buton sayfada bulunamadı!';
        statusSpan.style.color = '#f87171';
      }
    };

    chrome.storage.local.get(['learnedTempChatSignature'], (res) => {
      if (res.learnedTempChatSignature) {
        statusSpan.innerText = `✅ Kayıtlı: "${res.learnedTempChatSignature.name || 'Buton'}"`;
        statusSpan.style.color = '#4ade80';
        testBtn.style.display = 'inline-block';
      }
    });

    makeElementDraggable(bar, dragHandle);
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

  function enterTeachingMode() {
    isTeachingMode = true;
    const teachBtn = document.getElementById('t-ozet-teach-btn');
    const statusSpan = document.getElementById('t-ozet-teach-status');

    teachBtn.innerText = '❌ İptal (Esc)';
    teachBtn.style.background = '#dc2626';
    statusSpan.innerText = '🎯 Sayfadaki GEÇİCİ SOHBET butonuna tıklayın!';
    statusSpan.style.color = '#38bdf8';

    document.addEventListener('mouseover', onElementHover, true);
    document.addEventListener('mouseout', onElementOut, true);
    document.addEventListener('click', onElementClickCapture, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function exitTeachingMode() {
    isTeachingMode = false;
    clearHighlight();

    const teachBtn = document.getElementById('t-ozet-teach-btn');
    if (teachBtn) {
      teachBtn.innerText = '👆 Butonu Öğret';
      teachBtn.style.background = '#2563eb';
    }

    document.removeEventListener('mouseover', onElementHover, true);
    document.removeEventListener('mouseout', onElementOut, true);
    document.removeEventListener('click', onElementClickCapture, true);
    document.removeEventListener('keydown', onKeyDown, true);
  }

  function onElementHover(e) {
    if (!isTeachingMode) return;
    if (e.target.closest('#t-ozet-teaching-bar')) return;

    clearHighlight();
    hoveredElement = e.target.closest('button, [role="button"], mat-slide-toggle, mat-button-toggle, a, mat-icon') || e.target;
    if (hoveredElement) {
      hoveredElement.style.outline = '2px solid #38bdf8';
      hoveredElement.style.outlineOffset = '2px';
      hoveredElement.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.9)';
    }
  }

  function onElementOut(e) {
    if (!isTeachingMode) return;
    clearHighlight();
  }

  function clearHighlight() {
    if (hoveredElement) {
      hoveredElement.style.outline = '';
      hoveredElement.style.outlineOffset = '';
      hoveredElement.style.boxShadow = '';
      hoveredElement = null;
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && isTeachingMode) {
      exitTeachingMode();
    }
  }

  async function onElementClickCapture(e) {
    if (!isTeachingMode) return;
    if (e.target.closest('#t-ozet-teaching-bar')) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target.closest('button, [role="button"], mat-slide-toggle, mat-button-toggle, a') || e.target;
    clearHighlight();

    const signature = extractElementSignature(target);
    console.log("💾 Öğrenilen Buton İmzası:", signature);

    await chrome.storage.local.set({ learnedTempChatSignature: signature });

    const statusSpan = document.getElementById('t-ozet-teach-status');
    const testBtn = document.getElementById('t-ozet-test-btn');
    if (statusSpan) {
      statusSpan.innerText = `🎉 Kaydedildi: "${signature.name}"!`;
      statusSpan.style.color = '#4ade80';
    }
    if (testBtn) testBtn.style.display = 'inline-block';

    setTimeout(() => {
      fullSyntheticClick(target);
    }, 100);

    exitTeachingMode();
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

    const name = ariaLabel || text || iconName || 'Geçici Sohbet Butonu';

    return {
      name: name.substring(0, 30),
      ariaLabel: ariaLabel.trim(),
      text: text.trim(),
      iconName: iconName.trim(),
      dataTestId: dataTestId.trim(),
      tag: el.tagName.toLowerCase()
    };
  }

  function typeAndSubmit(inputEl, text) {
    if (!inputEl) return;
    inputEl.focus();

    if (inputEl.tagName === 'TEXTAREA') {
      inputEl.value = text;
    } else {
      inputEl.innerText = text;
    }

    inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    setTimeout(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const sendBtn = allButtons.find(b => {
        const label = (b.getAttribute('aria-label') || '').toLowerCase();
        const isSendClass = b.className.includes('send-button') || b.className.includes('submit');
        const hasArrow = b.innerHTML.includes('arrow_upward') || b.innerHTML.includes('send') || b.innerHTML.includes('M2.01');
        return !b.disabled && (label.includes('gönder') || label.includes('send') || isSendClass || hasArrow);
      });

      if (sendBtn) {
        sendBtn.click();
        console.log("🚀 T-Özet: Gönder butonuna tıklandı!");
        updateBarStatus("✅ Özet Başarıyla Gönderildi!", "#4ade80");
      } else {
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        console.log("🚀 T-Özet: Enter tuşu tetiklendi!");
        updateBarStatus("✅ Özet Başarıyla Gönderildi!", "#4ade80");
      }
    }, 300);
  }
})();