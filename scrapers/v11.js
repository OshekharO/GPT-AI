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
    // Using Pollinations.ai with Llama model to provide a Groq-like experience
    const response = await axios.get(`${apiUrl}${encodeURIComponent(finalMessage)}?model=llama`);
    
    if (!response.data) {
      throw new Error('No response content received from Pollinations');
    }

    res.json({ 
      status: "success",
      text: response.data,
      api: "groq (via pollinations/llama)"
    });

  } catch (error) {
    console.error('Groq/Pollinations API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      status: "error",
      message: 'Failed to process Groq request',
      details: error.message,
      attempted_query: finalMessage
    });
  }

});

module.exports = router;
