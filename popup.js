// popup.js

// Check if API key is configured and update status text
chrome.storage.sync.get(['apiKey'], (result) => {
  const status = document.getElementById('status');
  if (status) {
    if (result.apiKey) {
      status.classList.remove('inactive');
      status.classList.add('active');
      status.textContent = '● Ready to use';
    } else {
      status.classList.remove('active');
      status.classList.add('inactive');
      status.textContent = '● Not configured';
    }
  }
});

// Open options page functionality
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});