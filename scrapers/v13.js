const express = require('express');
const axios = require('axios');
const { randomUUID } = require('crypto');

const router = express.Router();

// API Route v13 - Supabase/gpt-5-mini
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ 
      error: "No message provided or message is not a string"
    });
  }

  const apiUrl = 'https://qcpujeurnkbvwlvmylyx.supabase.co/functions/v1/chat';

  try {
    const response = await axios.post(apiUrl, {
      messages: [{ role: "user", content: userMessage }],
      model: "openai/gpt-5-mini",
      anonymousUserId: randomUUID(),
      isContinuation: false
    }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text'
    });

    let reply = '';
    let lineBuffer = response.data;
    let newlineIdx;

    while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
      const line = lineBuffer.slice(0, newlineIdx).trim();
      lineBuffer = lineBuffer.slice(newlineIdx + 1);
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (dataStr === '[DONE]') break;
      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (content) reply += content;
      } catch {
        // skip malformed chunks
      }
    }

    if (!reply && lineBuffer.trim().startsWith('data:')) {
      const dataStr = lineBuffer.trim().slice(5).trim();
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          const content = parsed?.choices?.[0]?.delta?.content;
          if (content) reply += content;
        } catch {
          // ignore
        }
      }
    }

    if (!reply) {
      throw new Error('No valid response content received');
    }

    res.json({ 
      reply,
      api: "supabase/gpt-5-mini"
    });

  } catch (error) {
    console.error('v13 API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }

});

module.exports = router;
