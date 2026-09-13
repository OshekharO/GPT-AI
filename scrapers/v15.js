const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v15 - Anshari
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const apiUrl = 'https://api.ansari.chat/api/v1/complete';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Postify/1.0.0',
    'Referer': 'https://ansari.chat/',
    'Origin': 'https://ansari.chat',
    'x-forwarded-for': new Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.')
  };
  const body = {
    messages: [
      {
        role: "user",
        content: userMessage
      }
    ]
  };

  try {
    const response = await axios.post(apiUrl, body, { headers });
    
    if (!response.data) {
      throw new Error('No response data received');
    }

    res.json({ reply: response.data });

  } catch (error) {
    console.error('Anshari API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ 
      error: error.response?.data?.message || 'Something went wrong with Anshari API' 
    });
  }
});

module.exports = router;
