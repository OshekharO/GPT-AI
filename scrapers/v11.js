const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v11 - groq
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://api-zenn.vercel.app/api/ai/groq';
  
  if (!userMessage) {
    return res.status(400).json({ 
      error: "No message provided" 
    });
  }

  try {
    const response = await axios.get(`${apiUrl}?q=${encodeURIComponent(userMessage)}`);
    
    if (!response.data?.data) {
      throw new Error('No valid response data received');
    }

    res.json({ 
      reply: response.data.data,
      api: "groq"
    });

  } catch (error) {
    console.error('Groq API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process Groq request',
      details: error.response?.data?.message || error.message,
      attempted_query: userMessage
    });
  }
});

module.exports = router;
