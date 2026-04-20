const express = require('express');
const axios = require('axios');
const { randomUUID } = require('crypto');
const rateLimit = require('express-rate-limit');
const { DeviceProfiles } = require('@denniskrol/device-profiles');

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

// Build a realistic sec-ch-ua header string from userAgentData brands
function buildSecChUa(brands) {
  if (!brands || brands.length === 0) return undefined;
  return brands.map(b => `"${b.brand}";v="${b.version}"`).join(', ');
}

// API Route v15 - QuillBot AI Chat
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Pick a weighted-random desktop profile for realistic fingerprinting
  const profile = DeviceProfiles.random({ deviceType: 'desktop' });
  const uaData = profile.userAgentData;

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
    'User-Agent': profile.userAgent,
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    ...(uaData && {
      'sec-ch-ua': buildSecChUa(uaData.brands),
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': `"${uaData.platform}"`
    })
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
