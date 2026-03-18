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

const PROVIDERS = {
  gemini: {
    buildRequest: function (input) {
      const urlBase = 'https://generativelanguage.googleapis.com/v1beta/models/';
      const url = urlBase + input.model + ':generateContent?key=' + input.apiKey;
      const headers = { 'Content-Type': 'application/json' };
      const body = {
        contents: [{ role: 'user', parts: [{ text: input.prompt + '\n\nPost:\n' + input.postContent }] }]
      };
      return { url, headers, body };
    },
    extractComment: function (data) {
      if (data && data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text ? data.candidates[0].content.parts[0].text : '';
      }
      return '';
    }
  },
  openai: {
    buildRequest: function (input) {
      const url = input.endpoint || 'https://api.openai.com/v1/chat/completions';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + input.apiKey
      };
      const body = {
        model: input.model,
        messages: [
          { role: 'system', content: input.prompt },
          { role: 'user', content: input.postContent }
        ]
      };
      return { url, headers, body };
    },
    extractComment: function (data) {
      if (data && data.choices && data.choices.length > 0) {
        return data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : '';
      }
      return '';
    }
  },
  anthropic: {
    buildRequest: function (input) {
      const url = input.endpoint || 'https://api.anthropic.com/v1/messages';
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': input.apiKey,
        'anthropic-version': '2023-06-01'
      };
      const body = {
        model: input.model,
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: input.prompt + '\n\nPost:\n' + input.postContent
              }
            ]
          }
        ]
      };
      return { url, headers, body };
    },
    extractComment: function (data) {
      if (data && data.content && data.content.length > 0) {
        const first = data.content[0];
        if (first && first.text) {
          return first.text;
        }
      }
      return '';
    }
  }
};

async function handleGenerateComment(postContent) {
  const result = await chrome.storage.sync.get(['provider', 'apiKey', 'apiEndpoint', 'apiModel', 'systemPrompt', 'styleMode']);
  
  const MY_API_KEY = "";
  const DEFAULT_MODEL = "gemini-2.5-flash";
 const DEFAULT_PROMPT = "You are writing a LinkedIn comment on behalf of Anas Khan, a 3rd year IT engineering student who works with frontend development, DSA, and AI. Anas writes in clean English but keeps it informal and human. He is still building and learning, so his comments come from a place of genuine relatability and not expertise. His tone naturally adapts to the post, more personal on journey or achievement posts, more builder-minded on technical posts. Read the following LinkedIn post and write one comment that sounds exactly like Anas genuinely read it and reacted. Pick one specific detail from the post and react to it. If there is a clear win or achievement, acknowledge it briefly and warmly. Words like Congratulations or Well done are fine but must never be the whole comment, always follow them with something specific and genuine from the post itself. If it is technical or a launch post, react from a learner or builder angle. Keep the tone clean English, informal and grounded, never corporate or fake motivational. Length should be 2 to 4 lines or have word between 18-20 words , never too short to feel lazy, never long enough to feel like an essay. Sound like a person, not a bot.Do not use exclamation marks, hyphens, or symbols like -- or !!!. You may use one subtle emoji only if it fits naturall. ";
  const apiKey = (result.apiKey || MY_API_KEY).trim();
  const model = (result.apiModel || DEFAULT_MODEL).trim();
  const savedEndpoint = result.apiEndpoint || '';

  // Safety Check
  if (!apiKey) {
    throw new Error('API key is missing.');
  }

  const storedPrompt = typeof result.systemPrompt === 'string' ? result.systemPrompt.trim() : '';
  const systemPrompt = storedPrompt.length > 0 ? storedPrompt : DEFAULT_PROMPT;
  const styleMode = typeof result.styleMode === 'string' ? result.styleMode : 'balanced';
  let styleInstruction = '';
  if (styleMode === 'casual') {
    styleInstruction = 'Use a slightly more casual, conversational LinkedIn tone while staying professional.';
  } else if (styleMode === 'formal') {
    styleInstruction = 'Use a more formal, polished LinkedIn tone suitable for corporate audiences.';
  } else if (styleMode === 'technical') {
    styleInstruction = 'Focus on technical depth and specific insights when appropriate, assuming a knowledgeable audience.';
  }
  const finalSystemPrompt = styleInstruction ? systemPrompt + ' ' + styleInstruction : systemPrompt;
  const providerKey = typeof result.provider === 'string' ? result.provider : 'gemini';
  const providerConfig = PROVIDERS[providerKey] || PROVIDERS.gemini;

  try {
    const request = providerConfig.buildRequest({
      model: model,
      apiKey: apiKey,
      endpoint: savedEndpoint,
      prompt: finalSystemPrompt,
      postContent: postContent
    });

    console.log(`Sending request to ${model} using ${providerKey}...`);

    const response = await fetch(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(request.body)
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

    let comment = providerConfig.extractComment(data);
    if (!comment && data.candidates && data.candidates.length > 0) {
      comment = data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text ? data.candidates[0].content.parts[0].text : '';
    }
    if (!comment && data.choices && data.choices.length > 0) {
      comment = data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : '';
    }
    if (!comment) {
      console.warn("Unexpected JSON structure:", data);
      throw new Error("AI returned an empty or blocked response.");
    }

    return { comment: comment.trim().replace(/^["']|["']$/g, '') };

  } catch (error) {
    throw error;
  }
}
