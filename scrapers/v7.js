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
  const headers = {
    'content-type': 'application/json',
    'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjcwZmM5YzU0YjhiMjQyMWZmMTgyOTgxNTQyZmQ0NjRlOWJlYzM1NDUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU2Frc2hhbSBTaGVraGVyIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0laVGJCWjdpcEs4aWFubktBSGNfem9zOVdYOU1tVVVNdG9YeG9XY0JteXd4U251cTNuPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2ZyZWVkb20tZ3B0IiwiYXVkIjoiZnJlZWRvbS1ncHQiLCJhdXRoX3RpbWUiOjE3NzY2NjcxODYsInVzZXJfaWQiOiJqUEhxVlYxbG9BWHhDeTlXdmdzMDNWc0lrZ2oxIiwic3ViIjoialBIcVZWMWxvQVh4Q3k5V3ZnczAzVnNJa2dqMSIsImlhdCI6MTc3NjY2NzE4NiwiZXhwIjoxNzc2NjcwNzg2LCJlbWFpbCI6Im9tZWVwZDAwOUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExODI5Nzk5ODcxOTEyMDIwMzc5NiJdLCJlbWFpbCI6WyJvbWVlcGQwMDlAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.lFeECWLzbc_iwZo3dKP9rpsPlkY612b5Mk-7L6_6TEMmJHnyXu2driMUS-ShZ0RCOMsNdlKPIklyhB96WxBM1D9WWzxI7-cLhJSgBkjHrKxu4byKSdBCTZ8e1-KjYaC2BFmS9465dpIeCzemSIDgyyQ6OuQdJcEGrwnzE9MTZ9RKqOfzH46W2nTBUZXmgFeXbz3xLgD3_GkveVBgr3Ire_CAat5BuIzNHGNy1P-K1VcGERLZ7eebdBB5Vn3QXwfez7FcwnMDHvBGpXbLPh7X515A24RqwdOrfAkvdeNo8szjwkXsweRJmTdtVwSvgkshBXGL3zvBRS2sqNwtqeZ-OA',
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
