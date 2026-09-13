const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

async function handleV15(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { userMessage, messages, userQuery, id, chatId, username, persona_name, ...rest } = source || {};

  let queryText = '';

  if (typeof userQuery === 'string' && userQuery) {
    queryText = userQuery;
  } else if (typeof userMessage === 'string' && userMessage) {
    queryText = userMessage;
  } else if (source && (source.message || source.prompt || source.q)) {
    const raw = source.message || source.prompt || source.q;
    queryText = Array.isArray(raw) ? raw[0] : raw;
  } else if (Array.isArray(messages) && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    queryText = typeof lastMsg === 'string' ? lastMsg : (lastMsg.content || lastMsg.text || '');
  }

  if (!queryText || typeof queryText !== 'string') {
    return res.status(400).json({ error: 'Message content is required (userMessage, userQuery, or messages array)' });
  }

  const apiUrl = 'https://beta.dopple.ai/api/messages/send';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const payload = {
    streamMode: 'none',
    chatId: chatId || '632cef078c294913b5b4653869eca845',
    folder: '',
    images: false,
    username: username || 'mn0uvp2fhv',
    persona_name: persona_name || 'DoppleAI',
    id: id || '46db0561-cb3e-43d9-8f50-40b3e3c84713',
    userQuery: queryText,
    ...rest
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers });

    const reply = response.data?.response;

    if (reply === undefined || reply === null) {
      throw new Error('No valid response content received from Dopple AI');
    }

    res.json({
      reply,
      status_code: response.data?.status_code || 200
    });

  } catch (error) {
    console.error('Dopple AI v15 API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process Dopple AI request',
      details: error.response?.data?.message || error.message
    });
  }
}

router.get('/', handleV15);
router.post('/', handleV15);

module.exports = router;
