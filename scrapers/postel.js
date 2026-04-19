const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route postel - postel.app chatgpt-alternative
router.post('/postel', async (req, res) => {
  const { userMessage, model = "gpt-4o", length = "medium" } = req.body;

  const apiUrl = 'https://www.postel.app/api/chatgpt-alternative/generate';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://www.postel.app',
    'Origin': 'https://www.postel.app'
  };

  if (!userMessage) {
    return res.status(400).json({ error: "Message content is required" });
  }

  try {
    const response = await axios.post(apiUrl, {
      prompt: userMessage,
      model: model,
      length: length
    }, { headers });

    const data = response.data;

    const rawReply = (data && typeof data === 'object') ? (data?.text ?? data) : data;
    const reply = typeof rawReply === 'string' ? rawReply : JSON.stringify(rawReply);
    const wordCount = typeof data?.wordCount === 'number'
      ? data.wordCount
      : (reply.trim() ? reply.trim().split(/\s+/).length : 0);

    res.json({
      reply,
      wordCount,
      model: data?.model || model,
      api: "Postel"
    });

  } catch (error) {
    console.error('Postel API Error:', error.response ? error.response.data : error.message);

    res.status(500).json({
      error: 'Failed to process Postel request',
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
