const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v11 - groq
router.post('/', async (req, res) => {
  const { prompt, userMessage } = req.body;
  const finalMessage = prompt || userMessage;

  const apiUrl = 'https://text.pollinations.ai/';
  
  if (!finalMessage) {
    return res.status(400).json({ 
      status: "error",
      message: "No message provided" 
    });
  }

  try {
    const response = await axios.get(`${apiUrl}${encodeURIComponent(userMessage)}?model=llama`);
    
    if (!response.data) {
      throw new Error('No valid response received from Pollinations');
    }

    res.json({ 
      reply: response.data,
      api: "groq (via pollinations/llama)"
    });

  } catch (error) {
    console.error('v11 API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process Groq request',
      details: error.message,
      attempted_query: userMessage
    });
  }

});

module.exports = router;
