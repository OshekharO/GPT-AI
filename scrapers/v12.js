const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v12 - Phind
router.post('/', async (req, res) => {
  const { prompt, userMessage } = req.body;
  const finalMessage = prompt || userMessage;

  const apiUrl = 'https://text.pollinations.ai/';
  
  if (!finalMessage) {
    return res.status(400).json({ 
      status: "error",
      message: "Message content is required" 
    });
  }

  try {
    // Using Pollinations.ai with Qwen-Coder model to provide a Phind-like (coding) experience
    const response = await axios.get(`${apiUrl}${encodeURIComponent(finalMessage)}?model=qwen-coder`);
    
    if (!response.data) {
      throw new Error('No response content received from Pollinations');
    }

    res.json({ 
      status: "success",
      text: response.data,
      api: "phind (via pollinations/qwen-coder)",
      model_used: "qwen-coder"
    });

  } catch (error) {
    console.error('Phind/Pollinations API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      status: "error",
      message: 'Failed to process Phind request',
      details: error.message,
      attempted_model: "Phind Model (Mapped to Qwen-Coder)"
    });
  }

});

module.exports = router;
