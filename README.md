# LinkedIn Comment Helper - Chrome Extension

AI-powered Chrome extension that generates professional, authentic LinkedIn comments with one click.

## 📋 Installation Instructions

### Step 1: Download the Extension Files

Download all files from the `/public/extension/` folder:
- `manifest.json`
- `background.js`
- `content.js`
- `style.css`
- `options.html`
- `options.js`
- `popup.html`

### Step 2: Create Extension Folder

1. Create a new folder on your computer (e.g., `linkedin-comment-helper`)
2. Move all downloaded files into this folder
3. **Important**: You also need icon files. Create simple 16x16, 48x48, and 128x128 PNG icons named `icon16.png`, `icon48.png`, and `icon128.png` (or remove the icons section from manifest.json temporarily)

### Step 3: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the folder containing your extension files
5. The extension should now appear in your extensions list

### Step 4: Configure API Key

1. Click the extension icon in Chrome toolbar
2. Click **Open Settings** (or right-click extension → Options)
3. Enter your OpenAI API Key
4. (Optional) Change API endpoint for other providers (Gemini, etc.)
5. (Optional) Select your preferred AI model
6. Click **Save Settings**

### Step 5: Use on LinkedIn

1. Go to [linkedin.com/feed](https://www.linkedin.com/feed)
2. Scroll through posts
3. Look for the **💬 Generate Comment** button on each post
4. Click it to generate and copy a professional comment
5. The comment is automatically copied to your clipboard
6. Paste it in the comment box (Ctrl+V / Cmd+V)

## 🔑 Getting an API Key

### OpenAI (Recommended)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy and save it (you won't see it again!)
6. Add billing information to your account

### Alternative Providers
- **Google Gemini**: Get key from [ai.google.dev](https://ai.google.dev)
- **Anthropic Claude**: Get key from [console.anthropic.com](https://console.anthropic.com)

For alternative providers, you'll need to update the API endpoint in settings.

## ⚙️ Configuration Options

### Provider
- Select Gemini, OpenAI, or Anthropic in the extension settings

### API Endpoint
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models:generateContent?key=`
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Anthropic: `https://api.anthropic.com/v1/messages`

You can override the endpoint field for custom-compatible providers.

### Model Selection
- Gemini: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
- OpenAI: gpt-4o-mini, gpt-4o, gpt-4.1-mini
- Anthropic: claude-3-5-sonnet-latest, claude-3-opus-latest, claude-3-haiku-latest

### Custom Prompt
- You can optionally set your own default prompt in the extension settings
- Leave it empty to use the built-in LinkedIn comment prompt

### Comment Style
- Choose between Balanced, Casual, Formal, or Technical tone in settings
- The selected style adds extra guidance on top of the default prompt

## 📝 Comment Generation Rules

The extension follows strict guidelines:

✅ **Always:**
- 18-22 words exactly
- Match the post's tone (formal/casual/technical)
- Add unique, valuable insights
- Sound completely human and natural

❌ **Never:**
- Generic phrases ("Great post", "Thanks for sharing")
- Exclamation marks (!) or hyphens (--)
- More than one emoji
- Generic agreement without value

## 🔧 Troubleshooting

### Button Doesn't Appear
- Refresh the LinkedIn page
- Make sure you're on linkedin.com/feed
- Check that the extension is enabled in chrome://extensions/

### "API Key Not Configured" Error
- Open extension settings
- Enter your API key
- Click Save Settings

### "API Error" Message
- Verify your API key is correct
- Check you have billing enabled (for OpenAI)
- Ensure you have API credits/quota remaining
- Try a different model (gpt-3.5-turbo uses less quota)

### Comments Not Generating
- Check browser console (F12) for errors
- Verify API key hasn't expired
- Check internet connection
- Try refreshing LinkedIn page

### LinkedIn DOM Changes
If LinkedIn updates their layout and buttons stop appearing:
1. Report the issue
2. The extension may need selector updates in `content.js`

## 🔒 Privacy & Security

- API keys are stored in Chrome's secure storage (chrome.storage.sync)
- Keys never leave your browser except to call the AI API
- No data is collected or sent to any third party
- All processing happens locally or via your chosen AI provider

## 💡 Tips for Best Results

1. **Let it load**: Wait for posts to fully load before expecting buttons
2. **Review before posting**: Always review AI-generated comments
3. **Personalize**: Add your own touch to make it more authentic
4. **Use sparingly**: Don't comment on everything - quality over quantity

## 🆕 Updates

This is v2.0.2. Future updates will be manual:
1. Download new files
2. Replace old files in your extension folder
3. Go to chrome://extensions/
4. Click the refresh icon on the extension card

## 📄 License

Free to use and modify for personal and commercial use.

## 🐛 Issues?

If you encounter issues:
1. Check the troubleshooting section above
2. Open Chrome DevTools (F12) and check Console for errors
3. Verify all files are in the same folder
4. Try disabling and re-enabling the extension

---

**Version**: 2.0.2  
**Manifest Version**: 3  
**Compatible with**: Chrome, Edge, Brave, and other Chromium browsers
