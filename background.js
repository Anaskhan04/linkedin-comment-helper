// Service Worker for handling API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateComment') {
    handleGenerateComment(request.postContent)
      .then(sendResponse)
      .catch(error => {
        console.error('Detailed API Error:', error);
        sendResponse({ error: error.message || 'API connection failed.' });
      });
    return true; // Required for async sendResponse
  }
});

async function handleGenerateComment(postContent) {
  const result = await chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'apiModel', 'systemPrompt']);
  
  const MY_API_KEY = "";
  const DEFAULT_MODEL = "gemini-2.5-flash";
  const DEFAULT_PROMPT = "You are a professional LinkedIn comment generator. Your task is to generate a unique, thoughtful comment (18-22 words) that adds real value or perspective. Comments must sound natural, human, and match the tone of a genuine LinkedIn professional. Avoid generic phrases such as Great post or Very informative. Do not use exclamation marks, hyphens, or symbols like -- or !!!. You may use one relevant emoji only if it fits naturally and maintains professionalism. Each comment must be supportive, insightful, or provide a meaningful observation tailored to the post.";

  const apiKey = (result.apiKey || MY_API_KEY).trim();
  const model = (result.apiModel || DEFAULT_MODEL).trim();
  const savedEndpoint = result.apiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models:generateContent?key=';

  // Safety Check
  if (!apiKey) {
    throw new Error('API key is missing.');
  }

  const storedPrompt = typeof result.systemPrompt === 'string' ? result.systemPrompt.trim() : '';
  const systemPrompt = storedPrompt.length > 0 ? storedPrompt : DEFAULT_PROMPT;

  try {
    let finalUrl, requestBody, headers = { 'Content-Type': 'application/json' };

    // --- CONFIGURATION ---
    if (savedEndpoint.includes('googleapis.com')) {
      // Gemini Logic
      const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";
      finalUrl = `${baseUrl}${model}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nPost:\n" + postContent }] }]
      };
    } else {
      // OpenAI Logic
      finalUrl = savedEndpoint;
      headers['Authorization'] = `Bearer ${apiKey}`;
      requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: postContent }
        ]
      };
    }

    console.log(`Sending request to ${model}...`);

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Check that your API key is valid and has access.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit or quota reached. Wait or adjust your model/provider usage.');
      }
      if (response.status >= 500) {
        throw new Error('The AI provider is currently unavailable. Try again in a moment.');
      }
      const message = data && data.error && data.error.message ? data.error.message : '';
      throw new Error(message || `API Error ${response.status}`);
    }

    // --- CRASH PROOF PARSER ---
    let comment = '';

    if (data.candidates && data.candidates.length > 0) {
      // Safe Gemini Parsing
      comment = data.candidates[0].content?.parts?.[0]?.text || "Error parsing Gemini response";
    } 
    else if (data.choices && data.choices.length > 0) {
      // Safe OpenAI Parsing
      comment = data.choices[0].message?.content || "Error parsing OpenAI response";
    } 
    else {
      console.warn("Unexpected JSON structure:", data);
      throw new Error("AI returned an empty or blocked response.");
    }

    return { comment: comment.trim().replace(/^["']|["']$/g, '') };

  } catch (error) {
    throw error;
  }
}
