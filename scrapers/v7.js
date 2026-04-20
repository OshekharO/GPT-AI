const fs = require('fs');

const userCode = `const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v7 - freedomgpt.com
router.post('/', async (req, res) => {
  const { prompt, userMessage } = req.body;
  const finalMessage = prompt || userMessage;

  const apiUrl = 'https://chat.freedomgpt.com/api/v1/chat/completions';
  const headers = {
    'accept': '*/*',
    'content-type': 'application/json',
    'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjcwZmM5YzU0YjhiMjQyMWZmMTgyOTgxNTQyZmQ0NjRlOWJlYzM1NDUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQW55YSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKS0F0X3lQeFcwSEVKZ05WSC0xT1JTaU5nb1UtT215aElvNmtLamczVFp1WDMzQzU0PXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2ZyZWVkb20tZ3B0IiwiYXVkIjoiZnJlZWRvbS1ncHQiLCJhdXRoX3RpbWUiOjE3NzY2MTMwMTIsInVzZXJfaWQiOiI0OWd1MjdJcDRlYlUybHo5cU9MTkh5eVoyYTczIiwic3ViIjoiNDlndTI3SXA0ZWJVMmx6OXFPTE5IeXlaMmE3MyIsImlhdCI6MTc3NjY1NTMyNywiZXhwIjoxNzc2NjU4OTI3LCJlbWFpbCI6ImFueWEuc3V6bWVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDk2MDE0OTM4NTE2Njc1OTQyMDMiXSwiZW1haWwiOlsiYW55YS5zdXptZUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.Fr7eQ8lQP764t6MKRG54fy9EcwzM5vn83Jr1ZtPx8tbdon9_W7Km1ybQaFd4oUNwtgN5P_nOIOEGF4hsRSCdkGECKF0EvoiW6ZjhBICItWRFnAM0o7pKHFzAf-n7-sZVTmlgo9zmZTnvB0KKgaW7ULeZL5Ljg0OnrfmU2w6KkTmT0KAj-zmlerSZ9Y5bOPEKMvjEupC0tpd97NLKa8Nl1BBHY7vQghcZnmxFRt_P02yMxBdcaiteJ8kdUjdfan_ovyt9yfu4743HWmvaPgmI09DMaJaVCwv-2Q3eP2JbWvp-oEYCt2K3mqvqH-NNV-SyWqw8OH-TNfx-A2zY5TkqIg',
    'referer': 'https://chat.freedomgpt.com/',
    'origin': 'https://chat.freedomgpt.com'
  };
  const body = {
    "model": {
      "id": "gemini-2.5-flash-lite"
    },
    "messages": [
      {
        "role": "user",
        "content": finalMessage,
        "id": require('crypto').randomUUID(),
        "createdAt": new Date().toISOString()
      }
    ],
    "temperature": 0,
    "customPrompt": false,
    "includeMemory": true
  };

  try {
    const response = await axios.post(apiUrl, body, { headers });
    
    // Parse SSE streaming response
    let fullText = "";
    const lines = response.data.split('\\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.replace('data: ', '').trim();
        if (dataStr === '[DONE]') break;
        try {
          const data = JSON.parse(dataStr);
          if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
            fullText += data.choices[0].delta.content;
          }
        } catch (e) {
          // ignore parsing errors for non-json lines
        }
      }
    }

    if (!fullText && response.data) {
        // Fallback if it wasn't SSE but a direct response
        fullText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    }

    res.json({ status: "success", text: fullText.trim() });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ status: "error", message: 'Something went wrong with authorization key' });
  }

});

module.exports = router;`;

const currentCode = fs.readFileSync('scrapers/v7.js', 'utf8');

function extractToken(code) {
  const match = code.match(/'authorization':\s*'Bearer\s+([^']+)'/);
  return match ? match[1] : null;
}

const userToken = extractToken(userCode);
const currentToken = extractToken(currentCode);

console.log('User Token Length:', userToken ? userToken.length : 'N/A');
console.log('Current Token Length:', currentToken ? currentToken.length : 'N/A');
console.log('Tokens Match:', userToken === currentToken);

if (userToken !== currentToken) {
  console.log('User Token Chunk (end):', userToken.slice(-50));
  console.log('Current Token Chunk (end):', currentToken.slice(-50));
}
