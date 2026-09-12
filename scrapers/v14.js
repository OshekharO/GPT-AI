const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v14 - chataibot.ru
router.post('/', async (req, res) => {
  const { userMessage, messages = [], ...rest } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const apiUrl = 'https://chataibot.ru/api/promo-chat/messages';
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': 'ru',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://chataibot.ru/app/free-chat'
  };

  // Prepare messages array
  let messagesToSend = Array.isArray(messages) ? [...messages] : [];
  messagesToSend.push({
    role: "user",
    content: userMessage
  });

  const body = {
    messages: messagesToSend,
    ...rest
  };

  try {
    const response = await axios.post(apiUrl, body, { 
      headers,
      compress: true
    });

    if (!response.data?.answer) {
      throw new Error('No answer received from Chataibot');
    }

    res.json({ reply: response.data.answer });

  } catch (error) {
    console.error('Chataibot API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ 
      error: error.response?.data?.message || 'Something went wrong with Chataibot API' 
    });
  }
});

module.exports = router;
