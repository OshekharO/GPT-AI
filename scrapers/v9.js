const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v9 - bookai.chat
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://api.bookai.chat:2096/chat';
  const headers = {
    'Content-Type': 'application/json',
    'origin': 'https://www.bookai.chat',
    'referer': 'https://www.bookai.chat/'
  };
  const body = {
    "chatId": "test-cleancode",
    "question": userMessage,
    "language": "English",
    "model": "gpt-3.5-turbo",
    "init": false,
    "messages": []
  };
  
  try {
    const response = await axios.post(apiUrl, body, { headers });
    let replyText = response.data;
    res.json({ reply: replyText });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Something went wrong with API v9 (clouflare)' });
  }
});

module.exports = router;
