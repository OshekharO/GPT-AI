const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v12 - Airforce
router.post('/', async (req, res) => {
  const { userMessage, messages, model = 'llama-instant', ...rest } = req.body || {};

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
  const envKey = process.env.AIRFORCE_API_KEY;
  const apiKey = authHeader || (envKey ? (envKey.startsWith('Bearer ') ? envKey : `Bearer ${envKey}`) : null);

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required. Provide Authorization header or set AIRFORCE_API_KEY env variable.'
    });
  }

  const apiUrl = 'https://api.airforce/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`
  };

  const payload = {
    model,
    messages: messagesToSend,
    ...rest
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers });

    const messageObj = response.data?.choices?.[0]?.message;
    if (!messageObj || typeof messageObj.content !== 'string') {
      throw new Error('No valid response content received from Airforce');
    }

    res.json({
      reply: messageObj.content,
      model: response.data?.model || model
    });

  } catch (error) {
    console.error('Airforce v12 API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process Airforce request',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
