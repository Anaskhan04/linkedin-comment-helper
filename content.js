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

function findCommentEditable(root) {
  const selectors = [
    'div[contenteditable="true"][data-placeholder*="omment"]',
    'div[contenteditable="true"][aria-label*="omment"]',
    'div[contenteditable="true"][role="textbox"][aria-multiline="true"]',
    'textarea[aria-label*="omment"]'
  ];
  for (let i = 0; i < selectors.length; i++) {
    const el = root.querySelector(selectors[i]);
    if (el) {
      return el;
    }
  }
  return null;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertCommentIntoCommentBox(bar, text) {
  if (!bar) {
    return;
  }
  
  // 1. Try to open the comment box if it's not open
  const commentBtn = bar.querySelector('button[aria-label*="omment"]');
  if (commentBtn) {
    commentBtn.click();
    await wait(500); // Wait for animation
  }

  // 2. Find the editable area
  let root = bar.closest('div[data-urn], article') || bar;
  let editable = findCommentEditable(root);
  
  // If not found in root, look in document but prioritize the one near the bar
  if (!editable) {
    const allEditables = document.querySelectorAll('div[contenteditable="true"]');
    // Find the one closest to our bar in the DOM
    let minDistance = Infinity;
    allEditables.forEach(el => {
      const rect1 = el.getBoundingClientRect();
      const rect2 = bar.getBoundingClientRect();
      const dist = Math.abs(rect1.top - rect2.top);
      if (dist < minDistance) {
        minDistance = dist;
        editable = el;
      }
    });
  }

  if (!editable) {
    showNotification('AI comment copied but comment box was not found', 'info');
    return;
  }

  // 3. Insert text robustly
  editable.focus();
  
  // Clear existing content first if needed
  if (typeof editable.value === 'string') {
    editable.value = '';
    editable.value = text;
  } else {
    // For contenteditable, execCommand is much better as it triggers LinkedIn's internal state
    try {
      // Clear existing
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      // Insert new
      document.execCommand('insertText', false, text);
    } catch (e) {
      console.warn('execCommand failed, falling back to innerText', e);
      editable.innerText = text;
    }
  }

  // Trigger events to make sure LinkedIn knows there is content
  const events = ['input', 'change', 'blur'];
  events.forEach(evtName => {
    const evt = new Event(evtName, { bubbles: true });
    editable.dispatchEvent(evt);
  });

  // 4. Find and click the submit button
  await wait(1000); // Give it a full second to enable

  const submitBtnSelectors = [
    'button.comments-comment-box__submit-button',
    'button[type="submit"].comments-comment-box__submit-button',
    '.comments-comment-box__form-container button[type="submit"]',
    '.comments-comment-box__footer button[type="submit"]',
    'button.artdeco-button--primary.comments-comment-box__submit-button',
    '.comments-comment-box__submit-button'
  ];

  let submitBtn = null;
  // Try finding it within the form or container first
  const container = editable.closest('.comments-comment-box__form-container') || 
                  editable.closest('form') || 
                  editable.closest('.comments-comment-box') ||
                  editable.parentElement?.parentElement; // Immediate context

  if (container) {
    for (const selector of submitBtnSelectors) {
      submitBtn = container.querySelector(selector);
      if (submitBtn) break;
    }
  }

  // Fallback to global search if not found in container
  if (!submitBtn) {
    for (const selector of submitBtnSelectors) {
      submitBtn = root.querySelector(selector) || document.querySelector(selector);
      if (submitBtn) break;
    }
  }

  if (submitBtn) {
    if (!submitBtn.disabled) {
      console.log('LinkedIn Comment Helper: Clicking post button');
      
      // Use a more realistic click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      submitBtn.dispatchEvent(clickEvent);
      
      showNotification('Comment posted automatically!', 'success');
    } else {
      console.log('LinkedIn Comment Helper: Post button found but disabled. Trying to force enable.');
      // One last attempt to wake it up
      editable.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      await wait(100);
      editable.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
      await wait(500);
      
      if (!submitBtn.disabled) {
        submitBtn.click();
        showNotification('Comment posted automatically!', 'success');
      } else {
        showNotification('Comment inserted, but Post button is disabled. Please click it manually.', 'info');
      }
    }
  } else {
    console.log('LinkedIn Comment Helper: Post button not found');
    showNotification('Comment inserted, but could not find the Post button.', 'info');
  }
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
      try {
        await navigator.clipboard.writeText(finalComment);
      } catch (clipboardError) {
        console.warn('Clipboard write failed', clipboardError);
      }
      btn.innerText = '✅ ';
      await insertCommentIntoCommentBox(bar, finalComment);
      if (wordCount < targetMin || wordCount > targetMax) {
        showNotification('Comment is ' + wordCount + ' words. Target is 18-22. It was adjusted slightly and inserted.', 'info');
      } else {
        showNotification('AI comment inserted into comment box', 'success');
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
