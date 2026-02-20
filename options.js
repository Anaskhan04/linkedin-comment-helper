document.addEventListener('DOMContentLoaded', loadSettings);

const form = document.getElementById('settingsForm');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

async function loadSettings() {
  const result = await chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'apiModel', 'systemPrompt', 'styleMode']);
  
  if (result.apiKey) {
    document.getElementById('apiKey').value = result.apiKey;
  }
  
  // Default Endpoint
  document.getElementById('apiEndpoint').value = result.apiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models:generateContent?key=';
  
  // FIX: Updated default to 2.5 Flash to match HTML
  document.getElementById('apiModel').value = result.apiModel || 'gemini-2.5-flash';
  if (result.systemPrompt) {
    document.getElementById('systemPrompt').value = result.systemPrompt;
  }
  document.getElementById('styleMode').value = result.styleMode || 'balanced';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
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
