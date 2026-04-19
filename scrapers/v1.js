const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// Magic value required by the notegpt.io sbox-guid cookie field
const NOTEGPT_SBOX_MAGIC = '907803882';
// 30 days in seconds, used for the _ga cookie's creation-time offset
const NOTEGPT_GA_OFFSET_SECONDS = 2592000;

function notegptMakeCookie() {
  const anonId = crypto.randomUUID();
  const sbox = Buffer.from(`${Math.floor(Date.now() / 1000)}|${NOTEGPT_SBOX_MAGIC}`).toString('base64');
  const gid = `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`;
  const ga = `GA1.2.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000 - NOTEGPT_GA_OFFSET_SECONDS)}`;
  return `anonymous_user_id=${anonId}; sbox-guid=${sbox}; _gid=${gid}; _ga=${ga}`;
}

async function handleV1(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { lang, model, tone, length, convId } = source;
  // Coerce userMessage to string to handle array values from repeated query params
  const rawMessage = source.userMessage;
  const userMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-store');
  }

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const conversationId = convId || crypto.randomUUID();
  const cookie = notegptMakeCookie();
  const headers = {
    'authority': 'notegpt.io',
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://notegpt.io',
    'referer': 'https://notegpt.io/ai-chat',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'cookie': cookie
  };
  const payload = {
    message: userMessage,
    language: lang || 'en',
    model: model || 'gpt-4.1-mini',
    tone: tone || 'default',
    length: length || 'moderate',
    conversation_id: conversationId
  };

  try {
    const response = await axios.post('https://notegpt.io/api/v2/chat/stream', payload, { headers, responseType: 'text' });

    const lines = response.data.split('\n');
    const texts = [];

    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data.trim()) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              texts.push(parsed.text);
            }
          } catch (parseErr) {
            console.error('NoteGPT SSE parse error:', parseErr.message, '| raw:', data);
          }
        }
      }
    });

    if (texts.length === 0) {
      return res.status(500).json({ error: 'NoteGPT returned no content' });
    }

    res.json({
      reply: texts.join(''),
      conversation_id: conversationId,
      api: 'NoteGPT'
    });
  } catch (error) {
    console.error('NoteGPT API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: error.response?.data?.message || 'Something went wrong with NoteGPT API'
    });
  }
}

router.get('/v1', handleV1);
router.post('/v1', handleV1);

module.exports = router;
