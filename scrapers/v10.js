const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

function generateRandomId(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function handleV10(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { userMessage, messages, ...rest } = source || {};

  const rawMessage = source ? (userMessage || source.message || source.prompt || source.q) : undefined;
  const msgStr = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  let messagesToSend = [];

  if (Array.isArray(messages) && messages.length > 0) {
    messagesToSend = messages.map(m => {
      if (m.parts && Array.isArray(m.parts)) {
        return {
          id: m.id || generateRandomId(16),
          role: m.role || 'user',
          parts: m.parts
        };
      }
      const textContent = typeof m.content === 'string' ? m.content : (m.text || JSON.stringify(m));
      return {
        id: m.id || generateRandomId(16),
        role: m.role || 'user',
        parts: [{ type: 'text', text: textContent }]
      };
    });
  }

  if (msgStr && typeof msgStr === 'string') {
    messagesToSend.push({
      id: generateRandomId(16),
      role: 'user',
      parts: [{ type: 'text', text: msgStr }]
    });
  }

  if (messagesToSend.length === 0) {
    return res.status(400).json({ error: 'Message content is required (userMessage or messages array)' });
  }

  const apiUrl = 'https://publicai.co/api/chat';
  const headers = {
    'content-type': 'application/json',
    'user-agent': 'ai-sdk/5.0.55 runtime/browser'
  };

  const payload = {
    tools: {},
    id: generateRandomId(16),
    messages: messagesToSend,
    trigger: 'submit-message'
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers,
      responseType: 'text'
    });

    let lineBuffer = response.data || '';
    let replyText = '';
    let newlineIdx;

    const parseLine = (line) => {
      if (!line.startsWith('data:')) return;
      const dataStr = line.slice(5).trim();
      if (dataStr === '[DONE]') return;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
          replyText += parsed.delta;
        }
      } catch (_) {
        // ignore malformed sse frames
      }
    };

    while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
      const line = lineBuffer.slice(0, newlineIdx).trim();
      lineBuffer = lineBuffer.slice(newlineIdx + 1);
      parseLine(line);
    }

    if (lineBuffer.trim().startsWith('data:')) {
      parseLine(lineBuffer.trim());
    }

    if (!replyText) {
      throw new Error('No valid response content received from publicai API');
    }

    res.json({
      reply: replyText,
      api: 'publicai'
    });
  } catch (error) {
    console.error('publicai API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: error.response?.data?.message || error.message || 'Something went wrong with publicai API'
    });
  }
}

router.get('/', handleV10);
router.post('/', handleV10);

module.exports = router;
