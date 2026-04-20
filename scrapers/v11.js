const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v11 - groq
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://text.pollinations.ai/';
  
  if (!userMessage) {
    return res.status(400).json({ 
      error: "No message provided" 
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
    console.error('Groq API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process Groq request',
      details: error.message,
      attempted_query: userMessage
    });
  }

});

module.exports = router;
