// content.js - AGGRESSIVE DEBUG VERSION
console.log('🚀 LinkedIn Comment Helper: STARTED');

// Run immediately, then every 2 seconds to fight lazy loading
injectButtons();
setInterval(injectButtons, 2000);

function injectButtons() {
  // 1. Find all possible containers for comment buttons
  // We look for the specific wrapper class LinkedIn uses for action bars
  const bars = document.querySelectorAll('.feed-shared-social-action-bar, .social-actions-bar, .comment-social-bar');
  
  if (bars.length === 0) {
    // If standard bars aren't found, try finding "Like" buttons and getting their parent
    // This is the "Nuclear Option" for finding the right spot
    const likeBtns = document.querySelectorAll('button[aria-label^="Like"], button[aria-label^="React"]');
    if (likeBtns.length > 0) {
      console.log(`found ${likeBtns.length} like buttons, trying to find parents...`);
      likeBtns.forEach(btn => {
        const parent = btn.parentElement.parentElement; // Go up to the row
        if (parent) processBar(parent);
      });
    }
    return;
  }

  // Process standard bars
  bars.forEach(processBar);
}

function processBar(bar) {
  // Stop if we already added a button here
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

  // Find the post text container relative to this bar
  const post = bar.closest('div[data-urn]') || bar.closest('.feed-shared-update-v2');

  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const textEl = post ? post.querySelector('.update-components-text span, .feed-shared-update-v2__description-text') : null;
    const text = textEl ? textEl.innerText : "";
    
    if (!text) {
      alert('Error: Could not read post text');
      return;
    }
    
    btn.innerText = '⌛';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateComment',
        postContent: text
      });
      if (response.error) throw new Error(response.error);
      
      await navigator.clipboard.writeText(response.comment);
      btn.innerText = '✅ ';
      
      // Open comment box
      const commentBtn = bar.querySelector('button[aria-label*="omment"]');
      if(commentBtn) commentBtn.click();
      
    } catch (err) {
      alert('Failed: ' + err.message);
      btn.innerText = '❌ Error';
    }
    
    setTimeout(() => btn.innerHTML = '<span>✨ </span>', 3000);
  };

  // Inject at the start of the bar
  bar.prepend(btn);
}