document.addEventListener('DOMContentLoaded', async () => {
  const btnSummarizePage = document.getElementById('btn-summarize-page');
  const btnOpenDirect = document.getElementById('btn-open-gemini-direct');
  const btnOptions = document.getElementById('btn-options');
  const presetButtons = document.querySelectorAll('.popup-preset-btn');
  const activePresetLabel = document.getElementById('active-preset-name');
  const customBox = document.getElementById('popup-custom-box');
  const customTextarea = document.getElementById('popup-custom-textarea');

  const PRESET_NAMES = {
    apple: '✨ Basit Özet',
    two_words: '⚡ 2 Kelimede Flaş',
    bullets: '📌 Madde Madde',
    table: '📊 Tablo Formatı',
    five_w: '📰 5N1K Gazetecilik',
    eli5: '🧒 Basit Anlat',
    executive: '💼 Yönetici Özeti',
    custom: '✍️ Özel Prompt'
  };

  const prefs = await chrome.storage.local.get(['activePreset', 'customPromptText']);
  let activePreset = prefs.activePreset || 'apple';
  let customPromptText = prefs.customPromptText || '';

  if (customTextarea) customTextarea.value = customPromptText;

  function updatePresetUI() {
    presetButtons.forEach(btn => {
      if (btn.dataset.preset === activePreset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (activePresetLabel) {
      activePresetLabel.innerText = PRESET_NAMES[activePreset] || activePreset;
    }

    if (customBox) {
      customBox.style.display = activePreset === 'custom' ? 'flex' : 'none';
    }
  }

  updatePresetUI();

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activePreset = btn.dataset.preset;
      chrome.storage.local.set({ activePreset: activePreset });
      updatePresetUI();
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.activePreset) {
        activePreset = changes.activePreset.newValue;
        updatePresetUI();
      }
      if (changes.customPromptText && customTextarea) {
        customPromptText = changes.customPromptText.newValue;
        customTextarea.value = customPromptText;
      }
    }
  });

  if (customTextarea) {
    customTextarea.addEventListener('input', () => {
      customPromptText = customTextarea.value;
      chrome.storage.local.set({ customPromptText: customPromptText });
    });
  }

  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  if (btnOpenDirect) {
    btnOpenDirect.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_GEMINI_POPUP' });
      window.close();
    });
  }

  if (btnSummarizePage) {
    btnSummarizePage.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'CONTEXT_MENU_SUMMARIZE_PAGE' });
        window.close();
      }
    });
  }
});