const express = require('express');
const axios = require('axios');
const { randomUUID } = require('crypto');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limit: 1 request per 10 seconds per IP (to avoid triggering Cloudflare)
const v15Limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 10 seconds before sending another message.' }
});
router.use(v15Limiter);

// Mobile user agents are less likely to be flagged by Cloudflare bot-detection
// when requests originate from a datacenter IP.
const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
];

function randomMobileUA() {
  return MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)];
}

// API Route v15 - QuillBot AI Chat
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  const conversationId = randomUUID();
  const apiUrl = `https://quillbot.com/api/ai-chat/chat/conversation/${conversationId}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Accept-Language': 'en-US,en;q=0.9',
    'useridtoken': 'empty-token',
    'webapp-version': '41.23.0',
    'platform-type': 'webapp',
    'qb-product': 'AI-CHAT',
    'Origin': 'https://quillbot.com',
    'Referer': 'https://quillbot.com/',
    'User-Agent': randomMobileUA(),
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  const body = {
    message: { content: userMessage, files: [] },
    context: {},
    origin: { name: 'ai-chat.chat', url: 'https://quillbot.com' }
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers,
      responseType: 'stream',
      timeout: 25000
    });

    const responseText = await new Promise((resolve, reject) => {
      const chunks = [];
      response.data.on('data', chunk => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      response.data.on('error', reject);
    });

    const lines = responseText.split('\n');
    let reply = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // SSE events are prefixed with "data: "; strip it before parsing
      const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
      if (jsonStr === '[DONE]') break;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === 'content' && parsed.content) {
          reply += parsed.content;
        }
      } catch {
        // skip malformed lines
      }
    }

    if (!reply) {
      throw new Error('No content received from QuillBot');
    }

    res.json({ reply, api: 'QuillBot' });

  } catch (error) {
    let errorDetail = error.message;
    if (error.response) {
      const chunks = [];
      await new Promise((resolve, reject) => {
        error.response.data.on('data', c => chunks.push(c));
        error.response.data.on('end', resolve);
        error.response.data.on('error', reject);
      }).catch(() => {});
      errorDetail = `HTTP ${error.response.status}: ${Buffer.concat(chunks).toString('utf-8')}`;
    }
    console.error('QuillBot API Error:', errorDetail);
    res.status(500).json({ error: 'Something went wrong with QuillBot API' });
  }
});

module.exports = router;
