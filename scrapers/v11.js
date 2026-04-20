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
    // Migrated from Airforce to Pollinations for stability
    const response = await axios.get(`${apiUrl}${encodeURIComponent(finalMessage)}?model=mistral`);
    
    if (!response.data) {
      throw new Error('No response content received from Pollinations');
    }

    res.json({ 
      reply: response.data,
      api: "groq replacement (via pollinations/mistral)"
    });

  } catch (error) {
    console.error('v11 API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      status: "error",
      message: 'Failed to process request',
      details: error.message
    });
  }


});

module.exports = router;
