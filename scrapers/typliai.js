const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// Route typliai
router.post('/typliai', async (req, res) => {
  const { userMessage, model = "openai/gpt-4o-mini", messages } = req.body;

  const apiUrl = 'https://typli.ai/api/generators/chat';

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ 
      error: "Message content is required and must be a string" 
    });
  }

  const safeMessages = Array.isArray(messages) ? messages : [];

  const timestamp = Date.now();
  const BASE36 = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomStr = Array.from(crypto.randomBytes(6)).map(b => BASE36[b % 36]).join('');
  const csrfToken = Buffer.from(`${timestamp}:${randomStr}`).toString('base64');
  const conversationId = crypto.randomBytes(12).toString('base64url').substring(0, 16);
  const msgId = crypto.randomBytes(9).toString('base64url').substring(0, 12);

  const headers = {
    'content-type': 'application/json',
    'user-agent': 'ai-sdk/5.0.150 runtime/browser',
    'x-csrf-token': csrfToken,
    'origin': 'https://typli.ai',
    'referer': 'https://typli.ai/free-no-sign-up-chatgpt'
  };

  const allMessages = [...safeMessages, {
    parts: [{ type: "text", text: userMessage }],
    id: msgId,
    role: "user"
  }];

  const payload = {
    slug: "free-no-sign-up-chatgpt",
    modelId: model,
    id: conversationId,
    messages: allMessages,
    trigger: "submit-message"
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers, responseType: 'text' });

    let reply = '';
    const lines = response.data.split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const data = line.substring(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'text-delta' && parsed.delta) {
              reply += parsed.delta;
            }
          } catch {
            // ignore non-JSON lines
          }
        }
      }
    });

    if (!reply) {
      return res.status(500).json({ error: 'TypliAI returned no content' });
    }

    res.json({ 
      reply: reply,
      api: "TypliAI"
    });

  } catch (error) {
    console.error('TypliAI API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process TypliAI request',
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
