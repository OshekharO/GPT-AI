const express = require('express');
const axios = require('axios');

const router = express.Router();

async function handleV3(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { userMessage, messages, ...rest } = source || {};

  const rawMessage = source ? (userMessage || source.message || source.prompt || source.q) : undefined;
  const msgStr = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  let messagesToSend = [];

  if (Array.isArray(messages) && messages.length > 0) {
    messagesToSend = [...messages];
  } else if (msgStr && typeof msgStr === 'string') {
    messagesToSend = [
      {
        role: 'user',
        content: msgStr
      }
    ];
  }

  if (messagesToSend.length === 0) {
    return res.status(400).json({ error: 'Message content is required (userMessage or messages array)' });
  }

  const apiUrl = 'https://ai.riple.org/';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const payload = {
    messages: messagesToSend,
    ...rest
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers,
      responseType: 'stream'
    });

    let lineBuffer = '';
    let replyText = '';

    const parseLine = (line) => {
      if (!line.startsWith('data:')) return;
      const dataStr = line.slice(5).trim();
      if (dataStr === '[DONE]') return;
      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          replyText += delta;
        }
      } catch (_) {
        // ignore malformed SSE chunks
      }
    };

    response.data.on('data', (chunk) => {
      lineBuffer += chunk.toString('utf-8');
      let newlineIdx;
      while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
        const line = lineBuffer.slice(0, newlineIdx).trim();
        lineBuffer = lineBuffer.slice(newlineIdx + 1);
        parseLine(line);
      }
    });

    response.data.on('end', () => {
      if (lineBuffer.trim().startsWith('data:')) {
        parseLine(lineBuffer.trim());
      }

      if (!replyText) {
        if (!res.headersSent) {
          return res.status(500).json({ error: 'No valid response content received from Riple AI' });
        }
      } else {
        if (!res.headersSent) {
          return res.json({ reply: replyText });
        }
      }
    });

    response.data.on('error', (err) => {
      console.error('Stream error in v3 API:', err.message);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Stream error in v3 API', details: err.message });
      }
    });

  } catch (error) {
    console.error('Riple AI v3 API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process Riple AI request',
      details: error.response?.data?.error?.message || error.message
    });
  }
}

router.get('/', handleV3);
router.post('/', handleV3);

module.exports = router;
