const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v6 - PinoyGPT
router.post('/v6', async (req, res) => {
  const { userMessage } = req.body;
  const apiUrl = 'https://www.pinoygpt.com/wp-json/mwai-ui/v1/chats/submit';

  const headers = {
    'content-type': 'application/json',
    'accept': 'text/event-stream',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    'x-wp-nonce': 'ccbcf22745', // Note: This value need to be obtained dynamically
    'origin': 'https://www.pinoygpt.com',
    'referer': 'https://www.pinoygpt.com/',
    'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"'
  };

  const body = {
    "botId": "default",
    "customId": "e369e9665e1e4fa3fd0cdc970f31cf12",
    "session": "N/A",
    "contextId": 12,
    "newMessage": userMessage,
    "newFileId": null,
    "stream": true
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers: headers,
      responseType: 'stream'
    });

    let fullReply = '';

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'live' && data.data) {
              fullReply += data.data;
            } else if (data.type === 'end') {
              // handle end of stream here if needed
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error);
          }
        }
      });
    });

    response.data.on('end', () => {
      res.json({ reply: fullReply.trim() });
    });

  } catch (error) {
    console.error("API Request Error:", error);
    res.status(500).json({ error: 'Something went wrong with API v6' });
  }
});

module.exports = router;
