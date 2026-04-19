const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

const TYPLI_PAGE_URL = 'https://typli.ai/free-no-sign-up-chatgpt';
const TYPLI_API_URL = 'https://typli.ai/api/generators/chat';
const TYPLI_BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

async function getTypliSession() {
  const response = await axios.get(TYPLI_PAGE_URL, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': TYPLI_BROWSER_UA
    },
    maxRedirects: 5
  });

  const setCookies = response.headers['set-cookie'] || [];
  const cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');
  return cookieStr;
}

// Route typliai
router.post('/', async (req, res) => {
  const { userMessage, model = "openai/gpt-4o-mini", messages } = req.body;

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ 
      error: "Message content is required and must be a string" 
    });
  }

  const safeMessages = Array.isArray(messages) ? messages : [];

  const timestamp = Date.now();
  const BASE36 = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomStr = Array.from(crypto.randomBytes(6)).map(b => BASE36[b % 36]).join('');
  const csrfToken = Buffer.from(`${timestamp}:${randomStr}`).toString('base64');
  const conversationId = crypto.randomBytes(12).toString('base64url').substring(0, 16);
  const msgId = crypto.randomBytes(9).toString('base64url').substring(0, 12);

  let sessionCookies = '';
  try {
    sessionCookies = await getTypliSession();
  } catch (sessionErr) {
    console.warn('TypliAI: failed to fetch session cookies:', sessionErr.message);
  }

  // Build cookie string: session cookies from page GET + CSRF double-submit cookie
  const csrfCookie = `__Secure-ai-sdk-csrf-token=${csrfToken}`;
  const cookieHeader = sessionCookies
    ? `${sessionCookies}; ${csrfCookie}`
    : csrfCookie;

  const headers = {
    'content-type': 'application/json',
    'user-agent': TYPLI_BROWSER_UA,
    'x-csrf-token': csrfToken,
    'cookie': cookieHeader,
    'origin': 'https://typli.ai',
    'referer': TYPLI_PAGE_URL
  };

  const allMessages = [...safeMessages, {
    parts: [{ type: "text", text: userMessage }],
    id: msgId,
    role: "user"
  }];

  const payload = {
    slug: "free-no-sign-up-chatgpt",
    modelId: model,
    id: conversationId,
    messages: allMessages,
    trigger: "submit-message"
  };

  try {
    const response = await axios.post(TYPLI_API_URL, payload, { headers, responseType: 'text' });

    let reply = '';
    const lines = response.data.split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const data = line.substring(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'text-delta' && parsed.delta) {
              reply += parsed.delta;
            }
          } catch {
            // ignore non-JSON lines
          }
        }
      }
    });

    if (!reply) {
      return res.status(500).json({ error: 'TypliAI returned no content' });
    }

    res.json({ 
      reply: reply,
      api: "TypliAI"
    });

  } catch (error) {
    console.error('TypliAI API Error:', error.response ? error.response.data : error.message);
    const upstreamStatus = error.response?.status;
    const httpStatus = (upstreamStatus >= 400 && upstreamStatus < 600) ? upstreamStatus : 500;

    res.status(httpStatus).json({ 
      error: 'Failed to process TypliAI request',
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
