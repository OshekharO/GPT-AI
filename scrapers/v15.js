const express = require('express');
const axios = require('axios');
const { randomUUID } = require('crypto');

const router = express.Router();

// API Route v15 - QuillBot AI Chat
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  const conversationId = randomUUID();
  const apiUrl = `https://quillbot.com/api/ai-chat/chat/conversation/${conversationId}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'useridtoken': 'empty-token',
    'webapp-version': '41.23.0',
    'platform-type': 'webapp',
    'qb-product': 'AI-CHAT',
    'Origin': 'https://quillbot.com',
    'Referer': 'https://quillbot.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  };

  const body = {
    message: { content: userMessage, files: [] },
    context: {},
    origin: { name: 'ai-chat.chat', url: 'https://quillbot.com' }
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers,
      responseType: 'text'
    });

    const lines = response.data.split('\n');
    let reply = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === 'content' && parsed.content) {
          reply += parsed.content;
        }
      } catch {
        // skip malformed lines
      }
    }

    if (!reply) {
      throw new Error('No content received from QuillBot');
    }

    res.json({ reply, api: 'QuillBot' });

  } catch (error) {
    console.error('QuillBot API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: error.response?.data?.message || 'Something went wrong with QuillBot API'
    });
  }
});

module.exports = router;
