document.addEventListener('DOMContentLoaded', loadSettings);

const form = document.getElementById('settingsForm');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

const PROVIDER_CONFIG = {
  gemini: {
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models:generateContent?key=',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fastest)' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Smartest)' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Backup)' }
    ]
  },
  openai: {
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { value: 'gpt-4o', label: 'gpt-4o' },
      { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' }
    ]
  },
  anthropic: {
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-latest',
    models: [
      { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-opus-latest', label: 'Claude 3 Opus' },
      { value: 'claude-3-haiku-latest', label: 'Claude 3 Haiku' }
    ]
  }
};

function applyProviderToUi(providerKey, storedModel, storedEndpoint) {
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('apiModel');
  const endpointInput = document.getElementById('apiEndpoint');
  const config = PROVIDER_CONFIG[providerKey] || PROVIDER_CONFIG.gemini;
  providerSelect.value = providerKey;
  while (modelSelect.firstChild) {
    modelSelect.removeChild(modelSelect.firstChild);
  }
  config.models.forEach((m) => {
    const option = document.createElement('option');
    option.value = m.value;
    option.textContent = m.label;
    modelSelect.appendChild(option);
  });
  if (storedModel) {
    modelSelect.value = storedModel;
  }
  if (!modelSelect.value) {
    modelSelect.value = config.defaultModel;
  }
  if (storedEndpoint) {
    endpointInput.value = storedEndpoint;
  } else {
    endpointInput.value = config.defaultEndpoint;
  }
}

async function loadSettings() {
  const result = await chrome.storage.sync.get(['provider', 'apiKey', 'apiEndpoint', 'apiModel', 'systemPrompt', 'styleMode']);
  const provider = result.provider || 'gemini';
  applyProviderToUi(provider, result.apiModel, result.apiEndpoint);
  if (result.apiKey) {
    document.getElementById('apiKey').value = result.apiKey;
  }
  if (result.systemPrompt) {
    document.getElementById('systemPrompt').value = result.systemPrompt;
  }
  document.getElementById('styleMode').value = result.styleMode || 'balanced';
  document.getElementById('provider').addEventListener('change', (e) => {
    const key = e.target.value;
    applyProviderToUi(key, null, null);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
  const apiModel = document.getElementById('apiModel').value;
  const systemPrompt = document.getElementById('systemPrompt').value.trim();
  const styleMode = document.getElementById('styleMode').value;
  
  if (!apiKey) {
    showError();
    return;
  }
  
  await chrome.storage.sync.set({
    provider: provider,
    apiKey: apiKey,
    apiEndpoint: apiEndpoint,
    apiModel: apiModel,
    systemPrompt: systemPrompt,
    styleMode: styleMode
  });
  
  showSuccess();
});

function showSuccess() {
  errorAlert.classList.remove('show');
  successAlert.classList.add('show');
  setTimeout(() => successAlert.classList.remove('show'), 3000);
}

function showError() {
  errorAlert.classList.remove('show');
  errorAlert.classList.add('show');
  setTimeout(() => errorAlert.classList.remove('show'), 3000);
}
