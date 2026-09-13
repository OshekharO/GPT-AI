const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v7 - freedomgpt.com
router.post('/', async (req, res) => {
  const {
    userMessage,
    messages,
    model = 'weaver',
    temperature,
    max_tokens,
    top_k,
    top_p,
    batch_size,
    ...rest
  } = req.body || {};

  let messagesToSend = [];

  if (Array.isArray(messages) && messages.length > 0) {
    messagesToSend = [...messages];
  } else if (userMessage && typeof userMessage === 'string') {
    messagesToSend = [
      {
        role: 'user',
        content: userMessage
      }
    ];
  }

  if (messagesToSend.length === 0) {
    return res.status(400).json({ error: 'Message content is required (userMessage or messages array)' });
  }

  const authHeader = req.headers.authorization;
  const envKey = process.env.FREEDOMGPT_API_KEY || process.env.FGPT_API_KEY;
  const apiKey = authHeader || (envKey ? (envKey.startsWith('Bearer ') ? envKey : `Bearer ${envKey}`) : null);

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required. Provide Authorization header or set FREEDOMGPT_API_KEY env variable.'
    });
  }

  const apiUrl = 'https://chat.freedomgpt.com/api/v1/chat/completions';
  const headers = {
    'content-type': 'application/json',
    'authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
  };

  const body = {
    model,
    messages: messagesToSend,
    stream: true,
    ...(temperature !== undefined && { temperature }),
    ...(max_tokens !== undefined && { max_tokens }),
    ...(top_k !== undefined && { top_k }),
    ...(top_p !== undefined && { top_p }),
    ...(batch_size !== undefined && { batch_size }),
    ...rest
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers,
      responseType: 'stream'
    });

    let replyText = '';
    let lineBuffer = '';

    const cleanup = () => {
      req.removeListener('close', onClose);
    };

    const onClose = () => {
      if (response.data && typeof response.data.destroy === 'function') {
        response.data.destroy();
      }
    };

    req.on('close', onClose);

    response.data.on('data', (chunk) => {
      lineBuffer += chunk.toString();
      let newlineIdx;
      while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
        const line = lineBuffer.slice(0, newlineIdx).trim();
        lineBuffer = lineBuffer.slice(newlineIdx + 1);
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta;
          if (delta && typeof delta.content === 'string') {
            replyText += delta.content;
          }
        } catch (_) {}
      }
    });

    response.data.on('end', () => {
      cleanup();
      if (res.headersSent) return;
      res.json({ reply: replyText });
    });

    response.data.on('error', (err) => {
      cleanup();
      console.error('API v7 Stream Error:', err.message);
      if (res.headersSent) return;
      res.status(500).json({ error: 'Stream error with API v7' });
    });

  } catch (error) {
    console.error('API v7 Request Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process FreedomGPT request',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
