const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// API Route v3 - chateverywhere.app (v2 API)
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const submitId = `chat-v2-submit-${crypto.randomBytes(8).toString('hex')}`;
  const apiUrl = 'https://v2.chateverywhere.app/api/chat';
  const headers = {
    'content-type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://v2.chateverywhere.app/en'
  };

  const body = {
    submitId,
    startNewChat: true,
    content: userMessage,
    newFileIds: [],
    clientTimeZone: 'Asia/Calcutta',
    enabledTools: [
      'google-search',
      'web-browse',
      'memory',
      'diagram-generation',
      'read-file',
      'mqtt-connection',
      'youtube-analyzer',
      'ce-bot',
      'planner',
      'unsplash-image-search',
      'get-current-time'
    ],
    mqttConnections: [],
    useBot: null,
    isSuggestion: false,
    chatMode: 'default',
    imageGenerationModel: 'nano-banana',
    consentedSessionId: null
  };

  try {
    const postResponse = await axios.post(apiUrl, body, { headers });
    const { chatHash } = postResponse.data || {};

    if (!chatHash) {
      throw new Error('Failed to obtain chatHash from API v3');
    }

    const streamUrl = `https://v2.chateverywhere.app/api/chat/${chatHash}/stream?snapshotOnly=1`;
    const streamHeaders = {
      'User-Agent': headers['User-Agent'],
      'Referer': `https://v2.chateverywhere.app/en?chat=${chatHash}`
    };

    let replyText = '';
    const maxRetries = 15;
    const retryDelayMs = 1000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));

      const streamResponse = await axios.get(streamUrl, { headers: streamHeaders });
      const msgData = streamResponse.data?.message;

      const text = msgData?.content || msgData?.parts?.[0]?.text || '';
      const state = msgData?.parts?.[0]?.state;

      if (text) {
        replyText = text;
        if (state !== 'streaming') {
          break;
        }
      }
    }

    if (!replyText) {
      throw new Error('No content received from API v3 stream');
    }

    res.json({ reply: replyText });
  } catch (error) {
    console.error('API v3 Request Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Something went wrong with API v3' });
  }
});

module.exports = router;
