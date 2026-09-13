const express = require('express');
const axios = require('axios');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const router = express.Router();

// API Route v7 - freedomgpt.com
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const apiUrl = 'https://chat.freedomgpt.com/api/v1/chat/completions';

  if (!process.env.FREEDOMGPT_API_TOKEN) {
    console.error('API Request Error v7: FREEDOMGPT_API_TOKEN environment variable is not set');
    return res.status(500).json({ error: 'Something went wrong with authorization key' });
  }

  const headers = {
    'content-type': 'application/json',
    'authorization': `Bearer ${process.env.FREEDOMGPT_API_TOKEN}`,
    'x-fingerprint': 'f819a164d0018a61dae32bb14a97304ad5e68ade50df4f62f4a0d9b7ca550e82',
    'x-raw-fingerprint': '0abb4db8616f6397bde49e921ceb8172',
    'referer': 'https://chat.freedomgpt.com/',
    'origin': 'https://chat.freedomgpt.com'
  };
  const body = {
    "model": {
      "id": "claude-opus-4.7"
    },
    "messages": [
      {
        "role": "user",
        "content": userMessage,
        "id": uuidv4(),
        "createdAt": new Date().toISOString()
      }
    ],
    "temperature": 0,
    "customPrompt": false,
    "includeMemory": true
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers,
      responseType: 'stream'
    });

    let replyText = '';
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

    await new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        lineBuffer += chunk.toString();
        let newlineIdx;
        while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
          const line = lineBuffer.slice(0, newlineIdx).trim();
          lineBuffer = lineBuffer.slice(newlineIdx + 1);
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) replyText += content;
          } catch (_) {}
        }
      });

      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

    cleanup();
    if (res.headersSent) return;
    res.json({ reply: replyText });
  } catch (error) {
    console.error("API Request Error v7:", error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Something went wrong with authorization key' });
  }
});

module.exports = router;
