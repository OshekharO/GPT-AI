const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v13 - OpenGPT
router.post('/v13', async (req, res) => {
  const { userMessage, uid = "clf3yg8730000ih08ndbdi2v4" } = req.body;

  const apiUrl = 'https://open-gpt.app/api/generate';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    'Referer': `https://open-gpt.app/id/app/${uid}`
  };
  const body = {
    userInput: userMessage,
    id: uid,
    userKey: ""
  };

  try {
    const response = await axios.post(apiUrl, body, { headers });
    
    let responseData;
    if (typeof response.data === 'string') {
      try {
        responseData = JSON.parse(response.data);
      } catch {
        responseData = response.data;
      }
    } else {
      responseData = response.data;
    }

    res.json({ 
      reply: responseData,
      conversation_id: uid,
      api: "OpenGPT"
    });

  } catch (error) {
    console.error('OpenGPT API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process OpenGPT request',
      details: error.response?.data?.message || error.message,
      attempted_uid: uid
    });
  }
});

module.exports = router;
