const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v13 - OpenGPT
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
    // Migrating from OpenGPT (paywalled) to Pollinations.ai (Mistral model)
    const response = await axios.get(`${apiUrl}${encodeURIComponent(finalMessage)}?model=mistral`);
    
    if (!response.data) {
      throw new Error('No response content received from Pollinations');
    }

    res.json({ 
      status: "success",
      text: response.data,
      api: "OpenGPT replacement (via pollinations/mistral)"
    });

  } catch (error) {
    console.error('OpenGPT replacement API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      status: "error",
      message: 'Failed to process OpenGPT replacement request',
      details: error.message,
      attempted_query: finalMessage
    });
  }

});

module.exports = router;
