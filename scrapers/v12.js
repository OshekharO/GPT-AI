const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v12 - Phind
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ 
      error: "Message content is required and must be a string"
    });
  }

  const apiUrl = 'https://api.airforce/v1/chat/completions';

  try {
    const response = await axios.post(apiUrl, {
      messages: [{ role: "user", content: userMessage }],
      model: "gpt-4o-mini"
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('No valid response content received from Airforce');
    }

    res.json({ 
      reply: response.data.choices[0].message.content,
      api: "phind (via airforce/gpt-4o-mini)"
    });

  } catch (error) {
    console.error('Phind/Airforce API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ 
      error: 'Failed to process Phind request',
      details: error.response?.data?.error?.message || error.message,
      attempted_model: "gpt-4o-mini"
    });
  }

});

module.exports = router;
