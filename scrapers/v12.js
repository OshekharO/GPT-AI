const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v12 - Phind
router.post('/', async (req, res) => {
  const { prompt, userMessage } = req.body;
  const finalMessage = prompt || userMessage;

  const apiUrl = 'https://api.airforce/v1/chat/completions';
  
  if (!finalMessage) {
    return res.status(400).json({ 
      status: "error",
      message: "Message content is required" 
    });
  }

  try {
    // Using Airforce with GPT-4o-mini model
    const response = await axios.post(apiUrl, {
      messages: [
        {
          role: "user",
          content: finalMessage
        }
      ],
      model: "gpt-4o-mini"
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('No response content received from Airforce');
    }

    res.json({ 
      status: "success",
      text: response.data.choices[0].message.content,
      api: "phind (via airforce/gpt-4o-mini)",
      model_used: "gpt-4o-mini"
    });

  } catch (error) {
    console.error('Phind/Airforce API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      status: "error",
      message: 'Failed to process Phind request',
      details: error.response?.data?.error?.message || error.message,
      attempted_model: "Phind Model (Mapped to Airforce GPT-4o-mini)"
    });
  }


});

module.exports = router;
