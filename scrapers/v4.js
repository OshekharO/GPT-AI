const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// API Route v4 - unlimitedai.chat
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const apiUrl = 'https://app.unlimitedai.chat/api/chat';

  const headers = {
    'Content-Type': 'application/json',
    'x-next-intl-locale': 'en'
  };

  const chatId = crypto.randomUUID();
  const userMsgId = crypto.randomUUID();
  const assistantMsgId = crypto.randomUUID();
  const now = new Date().toISOString();

  const body = {
    chatId,
    messages: [
      {
        id: userMsgId,
        role: "user",
        content: userMessage,
        parts: [{ type: "text", text: userMessage }],
        createdAt: now
      },
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        parts: [{ type: "text", text: "" }],
        createdAt: now
      }
    ],
    selectedChatModel: "chat-model-reasoning",
    selectedCharacter: null,
    selectedStory: null,
    deviceId: crypto.randomUUID(),
    locale: "en"
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers,
      responseType: 'stream'
    });

    let fullReply = '';
    let lineBuffer = '';

    const cleanup = () => {
      req.removeListener('close', onClose);
    };

    const onClose = () => {
      if (response.data && typeof response.data.destroy === 'function') {
        response.data.destroy();
      }
    };

    req.on('close', onClose);

    response.data.on('data', (chunk) => {
      lineBuffer += chunk.toString();
      let newlineIdx;
      while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
        const line = lineBuffer.slice(0, newlineIdx).trim();
        lineBuffer = lineBuffer.slice(newlineIdx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'delta' && parsed.delta) {
            fullReply += parsed.delta;
          }
        } catch {
          // ignore non-JSON lines
        }
      }
    });

    response.data.on('end', () => {
      cleanup();
      if (res.headersSent) return;
      // process any remaining buffered content
      if (lineBuffer.trim()) {
        try {
          const parsed = JSON.parse(lineBuffer.trim());
          if (parsed.type === 'delta' && parsed.delta) {
            fullReply += parsed.delta;
          }
        } catch {
          // ignore
        }
      }
      res.json({ reply: fullReply });
    });

    response.data.on('error', (err) => {
      cleanup();
      console.error("Stream Error:", err);
      if (res.headersSent) return;
      res.status(500).json({ error: 'Stream error with API v4' });
    });
  } catch (error) {
    console.error("API Request Error:", error);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Something went wrong with API v4' });
  }
});

module.exports = router;
