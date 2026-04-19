const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v8 - chatwithfiction.com
router.post('/v8', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://www.chatwithfiction.com/api/gpt';
  const headers = {
    'referer': 'https://www.chatwithfiction.com/chat',
    'origin': 'https://www.chatwithfiction.com'
  };
  const body = {
    "prompt": userMessage,
    "prev": null
  };

  try {
    const response = await axios.post(apiUrl, body, { headers });

    let replyText = response.data;
    if (typeof replyText === 'string') {
      replyText = replyText.replace(/^"|"$/g, '');
    }

    res.json({ reply: replyText });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Something went wrong with csrf token maybe' });
  }
});

module.exports = router;
