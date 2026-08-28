document.addEventListener('DOMContentLoaded', async () => {
  const presetsContainer = document.getElementById('presets-container');
  const presetCards = document.querySelectorAll('.preset-card');
  const customPromptInput = document.getElementById('opt-custom-prompt');

  // Mini Monitör Elemanları
  const monitorFrame = document.getElementById('monitor-frame');
  const miniPopup = document.getElementById('mini-popup');
  const miniResize = document.getElementById('mini-resize');
  const miniDimText = document.getElementById('mini-dim-text');
  const statSize = document.getElementById('stat-size');
  const statPos = document.getElementById('stat-pos');
  const screenResText = document.getElementById('screen-res-text');

  const btnLeft = document.getElementById('preset-left');
  const btnRight = document.getElementById('preset-right');
  const btnCenter = document.getElementById('preset-center');
  const btnWide = document.getElementById('preset-wide');

  const screenW = window.screen.availWidth || window.screen.width || 1920;
  const screenH = window.screen.availHeight || window.screen.height || 1080;
  if (screenResText) screenResText.innerText = `🖥️ Ekranınız: ${screenW} × ${screenH}`;

  const prefs = await chrome.storage.local.get([
    'activePreset', 
    'customPromptText',
    'popupWidth',
    'popupHeight',
    'popupLeft',
    'popupTop'
  ]);

  let activePreset = prefs.activePreset || 'apple';
  let customPromptText = prefs.customPromptText || '';

  if (customPromptInput) customPromptInput.value = customPromptText;

  function updatePresetSelection() {
    presetCards.forEach(card => {
      if (card.dataset.preset === activePreset) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  updatePresetSelection();

  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      activePreset = card.dataset.preset;
      chrome.storage.local.set({ activePreset: activePreset });
      updatePresetSelection();
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.activePreset) {
        activePreset = changes.activePreset.newValue;
        updatePresetSelection();
      }
      if (changes.customPromptText && customPromptInput) {
        customPromptInput.value = changes.customPromptText.newValue;
      }
    }
  });

  if (customPromptInput) {
    customPromptInput.addEventListener('input', () => {
      chrome.storage.local.set({ customPromptText: customPromptInput.value });
    });
  }

  // SÜRÜKLENEBİLİR MONİTÖR MANTIĞI
  let popupW = parseInt(prefs.popupWidth, 10) || 540;
  let popupH = parseInt(prefs.popupHeight, 10) || 760;
  let popupX = parseInt(prefs.popupLeft, 10) || 50;
  let popupY = parseInt(prefs.popupTop, 10) || 60;

  function renderMonitor() {
    const frameW = monitorFrame.clientWidth || 640;
    const frameH = (monitorFrame.clientHeight || 340) - 25; // başlık çubuğu payı
    const scaleX = frameW / screenW;
    const scaleY = frameH / screenH;

    const miniW = Math.max(70, Math.round(popupW * scaleX));
    const miniH = Math.max(80, Math.round(popupH * scaleY));
    const miniX = Math.round(popupX * scaleX);
    const miniY = Math.round(popupY * scaleY) + 25;

    miniPopup.style.width = `${miniW}px`;
    miniPopup.style.height = `${miniH}px`;
    miniPopup.style.left = `${Math.max(0, Math.min(frameW - miniW, miniX))}px`;
    miniPopup.style.top = `${Math.max(25, Math.min(frameH + 25 - miniH, miniY))}px`;

    if (miniDimText) miniDimText.innerText = `${popupW}×${popupH}`;
    if (statSize) statSize.innerText = `${popupW} × ${popupH} px`;
    if (statPos) statPos.innerText = `X=${popupX}, Y=${popupY}`;
  }

  setTimeout(renderMonitor, 100);
  window.addEventListener('resize', renderMonitor);

  function savePosition() {
    chrome.storage.local.set({
      popupWidth: popupW,
      popupHeight: popupH,
      popupLeft: popupX,
      popupTop: popupY
    });
  }

  // Hızlı Ön Ayarlar
  if (btnLeft) {
    btnLeft.onclick = () => {
      popupW = 540; popupH = Math.round(screenH * 0.85); popupX = 30; popupY = 50;
      savePosition(); renderMonitor();
    };
  }
  if (btnRight) {
    btnRight.onclick = () => {
      popupW = 540; popupH = Math.round(screenH * 0.85); popupX = screenW - popupW - 30; popupY = 50;
      savePosition(); renderMonitor();
    };
  }
  if (btnCenter) {
    btnCenter.onclick = () => {
      popupW = 600; popupH = 780; popupX = Math.round((screenW - popupW) / 2); popupY = Math.round((screenH - popupH) / 2);
      savePosition(); renderMonitor();
    };
  }
  if (btnWide) {
    btnWide.onclick = () => {
      popupW = 720; popupH = Math.round(screenH * 0.9); popupX = screenW - popupW - 20; popupY = 40;
      savePosition(); renderMonitor();
    };
  }

  // Monitörde Sürükleme
  let isDragging = false, dragStartX = 0, dragStartY = 0, initialLeft = 0, initialTop = 0;
  miniPopup.onmousedown = (e) => {
    if (e.target === miniResize) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialLeft = miniPopup.offsetLeft;
    initialTop = miniPopup.offsetTop;
    document.onmousemove = onDrag;
    document.onmouseup = onStopDrag;
  };

  function onDrag(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const frameW = monitorFrame.clientWidth;
    const frameH = monitorFrame.clientHeight - 25;
    const scaleX = screenW / frameW;
    const scaleY = screenH / frameH;

    let newL = Math.max(0, Math.min(frameW - miniPopup.offsetWidth, initialLeft + dx));
    let newT = Math.max(25, Math.min(frameH + 25 - miniPopup.offsetHeight, initialTop + dy));

    miniPopup.style.left = `${newL}px`;
    miniPopup.style.top = `${newT}px`;

    popupX = Math.round(newL * scaleX);
    popupY = Math.round((newT - 25) * scaleY);
    if (statPos) statPos.innerText = `X=${popupX}, Y=${popupY}`;
  }

  function onStopDrag() {
    isDragging = false;
    document.onmousemove = null;
    document.onmouseup = null;
    savePosition();
  }
});