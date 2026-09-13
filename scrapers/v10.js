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

async function handleV10(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { lang, model, tone, length, convId, image_urls, chat_mode, enable_web_search, app_id, t, sign } = source || {};
  // Coerce userMessage to string to handle array values from repeated query params
  const rawMessage = source ? source.userMessage : undefined;
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
    language: lang || 'auto',
    model: model || 'minimax-m3',
    tone: tone || 'default',
    length: length || 'moderate',
    conversation_id: conversationId,
    image_urls: Array.isArray(image_urls) ? image_urls : [],
    chat_mode: chat_mode || 'standard',
    enable_web_search: enable_web_search !== undefined ? Boolean(enable_web_search) : false,
    app_id: app_id || 'notegpt_8c92b6'
  };

  if (t) payload.t = t;
  if (sign) payload.sign = sign;

  try {
    const response = await axios.post('https://notegpt.io/api/v2/chat/stream', payload, { headers, responseType: 'text' });

    let lineBuffer = response.data || '';
    const texts = [];
    const reasonings = [];
    let newlineIdx;

    const parseData = (dataStr) => {
      if (!dataStr.trim()) return;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.done) return;
        if (parsed.text) {
          texts.push(parsed.text);
        }
        if (parsed.reasoning) {
          reasonings.push(parsed.reasoning);
        }
      } catch (parseErr) {
        console.error('NoteGPT SSE parse error:', parseErr.message, '| raw:', dataStr);
      }
    };

    while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
      const line = lineBuffer.slice(0, newlineIdx).trim();
      lineBuffer = lineBuffer.slice(newlineIdx + 1);
      if (line.startsWith('data:')) {
        parseData(line.slice(5).trim());
      }
    }

    if (lineBuffer.trim().startsWith('data:')) {
      parseData(lineBuffer.trim().slice(5).trim());
    }

    const replyText = texts.join('');
    const reasoningText = reasonings.join('');

    if (!replyText && !reasoningText) {
      return res.status(500).json({ error: 'NoteGPT returned no content' });
    }

    res.json({
      reply: replyText || reasoningText,
      ...(reasoningText && replyText ? { reasoning: reasoningText } : {}),
      conversation_id: conversationId,
      api: 'NoteGPT'
    });
  } catch (error) {
    console.error('NoteGPT API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: error.response?.data?.message || 'Something went wrong with NoteGPT API'
    });
  }
}

router.get('/', handleV10);
router.post('/', handleV10);

module.exports = router;
