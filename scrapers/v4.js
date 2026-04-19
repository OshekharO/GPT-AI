const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// API Route v4 - unlimitedai.chat
router.post('/', async (req, res) => {
  const { userMessage } = req.body;
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
    let buffer = '';

    req.on('close', () => {
      response.data.destroy();
    });

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep the last (potentially incomplete) line
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.type === 'delta' && parsed.delta) {
            fullReply += parsed.delta;
          }
        } catch {
          // ignore non-JSON lines
        }
      });
    });

    response.data.on('end', () => {
      if (res.headersSent) return;
      // process any remaining buffered content
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
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
