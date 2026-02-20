// content.js - AGGRESSIVE DEBUG VERSION
console.log('LinkedIn Comment Helper: content script started');

injectButtons();
setInterval(injectButtons, 2000);

function showNotification(message, type) {
  const existing = document.querySelector('.linkedin-comment-helper-notification');
  if (existing) {
    existing.remove();
  }
  const el = document.createElement('div');
  el.className = 'linkedin-comment-helper-notification';
  if (type) {
    el.classList.add(type);
  }
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add('show');
  });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function findPostContainerFromBar(bar) {
  if (!bar) {
    return null;
  }
  const byDataUrn = bar.closest('div[data-urn]');
  if (byDataUrn) {
    return byDataUrn;
  }
  const legacy = bar.closest('.feed-shared-update-v2');
  if (legacy) {
    return legacy;
  }
  const generic = bar.closest('article');
  if (generic) {
    return generic;
  }
  return bar;
}

function getPostTextFromContainer(container) {
  if (!container) {
    return '';
  }
  const selectors = [
    '.update-components-text span',
    '.feed-shared-update-v2__description-text',
    '[data-test-id="post-content"]',
    'span.break-words',
    'div[dir="ltr"] span',
    'p[dir="ltr"]'
  ];
  for (let i = 0; i < selectors.length; i++) {
    const el = container.querySelector(selectors[i]);
    if (el && el.innerText && el.innerText.trim().length > 0) {
      return el.innerText.trim();
    }
  }
  let current = container.parentElement;
  let depth = 0;
  while (current && depth < 5) {
    for (let i = 0; i < selectors.length; i++) {
      const el = current.querySelector(selectors[i]);
      if (el && el.innerText && el.innerText.trim().length > 0) {
        return el.innerText.trim();
      }
    }
    current = current.parentElement;
    depth++;
  }
  return '';
}

function injectButtons() {
  const bars = document.querySelectorAll('.feed-shared-social-action-bar, .social-actions-bar, .comment-social-bar');
  if (bars.length === 0) {
    const likeBtns = document.querySelectorAll('button[aria-label^="Like"], button[aria-label^="React"]');
    if (likeBtns.length > 0) {
      console.log('LinkedIn Comment Helper: using fallback like/react buttons');
      likeBtns.forEach(btn => {
        const parent = btn.parentElement && btn.parentElement.parentElement;
        if (parent) {
          processBar(parent);
        }
      });
    }
    return;
  }
  bars.forEach(processBar);
}

function processBar(bar) {
  if (bar.querySelector('.linkedin-comment-helper-btn')) return;

  // Create the button
  const btn = document.createElement('button');
  btn.className = 'linkedin-comment-helper-btn';
  btn.innerHTML = '<span>✨ </span>';
  btn.style.marginRight = '8px';
  btn.style.borderRadius = '20px';
  btn.style.fontWeight = '600';
  btn.style.color = '#fff';
  btn.style.background = '#0a66c2';
  btn.style.border = 'none';
  btn.style.padding = '5px 12px';
  btn.style.cursor = 'pointer';

  const post = findPostContainerFromBar(bar);

  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const text = getPostTextFromContainer(post);
    if (!text) {
      showNotification('Could not read LinkedIn post text', 'error');
      return;
    }
    
    btn.innerText = '⌛';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateComment',
        postContent: text
      });
      if (response.error) {
        throw new Error(response.error);
      }
      const comment = response.comment || '';
      if (!comment || typeof comment !== 'string') {
        throw new Error('AI returned an empty comment. Try again or adjust your settings.');
      }
      const words = comment.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const targetMin = 18;
      const targetMax = 22;
      let finalComment = comment.trim();
      if (wordCount > targetMax) {
        finalComment = words.slice(0, targetMax).join(' ');
      }
      await navigator.clipboard.writeText(finalComment);
      btn.innerText = '✅ ';
      const commentBtn = bar.querySelector('button[aria-label*="omment"]');
      if (commentBtn) {
        commentBtn.click();
      }
      if (wordCount < targetMin || wordCount > targetMax) {
        showNotification('Comment is ' + wordCount + ' words. Target is 18-22. It was adjusted slightly.', 'info');
      } else {
        showNotification('AI comment copied to clipboard', 'success');
      }
    } catch (err) {
      btn.innerText = '❌ Error';
      showNotification(err.message || 'Failed to generate comment', 'error');
    }
    
    setTimeout(() => btn.innerHTML = '<span>✨ </span>', 3000);
  };

  // Inject at the start of the bar
  bar.prepend(btn);
}
