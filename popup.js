chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'apiModel'], (result) => {
  const status = document.getElementById('status');
  const details = document.getElementById('details');
  const hasKey = !!result.apiKey;
  const endpoint = result.apiEndpoint || '';
  const model = result.apiModel || '';
  const isGemini = endpoint.includes('googleapis.com') || endpoint === '';
  const provider = isGemini ? 'Gemini' : 'OpenAI-compatible';
  if (status) {
    if (hasKey) {
      status.classList.remove('inactive');
      status.classList.add('active');
      status.textContent = '● Ready to use';
    } else {
      status.classList.remove('active');
      status.classList.add('inactive');
      status.textContent = '● Not configured';
    }
  }
  if (details) {
    if (!hasKey) {
      details.textContent = 'Add your API key to start using the extension.';
    } else {
      const modelText = model || 'default model';
      details.textContent = 'Provider: ' + provider + ' • Model: ' + modelText;
    }
  }
});

document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
