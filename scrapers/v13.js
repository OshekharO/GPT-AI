const express = require('express');
const axios = require('axios');
const { randomUUID } = require('crypto');

const router = express.Router();

// API Route v11 - Supabase/gpt-5-nano
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://qcpujeurnkbvwlvmylyx.supabase.co/functions/v1/chat';

  if (!userMessage) {
    return res.status(400).json({ 
      error: "No message provided" 
    });
  }

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

    const lines = response.data.split('\n');
    let reply = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') break;
      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (content) reply += content;
      } catch {
        // skip malformed chunks
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
    
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }

});

module.exports = router;
