const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');

const router = express.Router();

// Reuse HTTP/HTTPS agents with TCP keep-alive enabled to avoid TCP handshakes
// and TLS negotiation overhead on repeated API requests. Saves ~30-100ms per call.
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const httpClient = axios.create({
  httpAgent,
  httpsAgent
});

// API Route v2 - OpenRouter
router.post('/', async (req, res) => {
  const { userMessage, messages = [], model = 'openrouter/free', reasoning, ...rest } = req.body || {};

  let messagesToSend = Array.isArray(messages) ? [...messages] : [];

  if (userMessage && typeof userMessage === 'string') {
    messagesToSend.push({
      role: 'user',
      content: userMessage
    });
  }

  if (messagesToSend.length === 0) {
    return res.status(400).json({ error: 'Message content is required (userMessage or messages array)' });
  }

  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  const authHeader = req.headers.authorization;
  const apiKey = authHeader || (process.env.OPENROUTER_API_KEY ? `Bearer ${process.env.OPENROUTER_API_KEY}` : null);

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required. Provide Authorization header or set OPENROUTER_API_KEY env variable.' });
  }

  const headers = {
    'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const body = {
    model,
    messages: messagesToSend,
    ...(reasoning !== undefined && { reasoning }),
    ...rest
  };

  try {
    const response = await httpClient.post(apiUrl, body, { headers });

    const messageObj = response.data?.choices?.[0]?.message;
    if (!messageObj) {
      throw new Error('No valid response content received from OpenRouter');
    }

    const reply = messageObj.content || '';
    const reasoningText = messageObj.reasoning || null;

    res.json({
      reply,
      ...(reasoningText && { reasoning: reasoningText })
    });

  } catch (error) {
    console.error('OpenRouter API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process OpenRouter request',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
