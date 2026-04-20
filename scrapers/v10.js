const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v10 - chataibot.ru
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://text.pollinations.ai/';

  if (!userMessage) {
    return res.status(400).json({ 
      error: "No message provided" 
    });
  }

  try {
    const response = await axios.get(`${apiUrl}${encodeURIComponent(userMessage)}?model=openai`);
    
    if (!response.data) {
      throw new Error('No valid response received from Pollinations');
    }

    res.json({ 
      reply: response.data,
      api: "chataibot replacement (via pollinations/kimi)"
    });

  } catch (error) {
    console.error('Chataibot replacement API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process Chataibot replacement request',
      details: error.message,
      attempted_query: userMessage
    });
  }

});

module.exports = router;
