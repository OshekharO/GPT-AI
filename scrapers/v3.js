const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v3 - chateverywhere.app
router.post('/', async (req, res) => {
  const { userMessage } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const apiUrl = 'https://chateverywhere.app/api/chat';
  const headers = {
    'origin': 'https://chateverywhere.app',
    'referer': 'https://chateverywhere.app/'
  };
  const body = {
    "model": {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5",
      "maxLength": 12000,
      "tokenLimit": 4000,
      "completionTokenLimit": 2500,
      "deploymentName": "gpt-35"
    },
    "messages": [
      {
        "pluginId": null,
        "content": userMessage,
        "fileList": [],
        "role": "user"
      }
    ],
    "prompt": "You are an AI language model named Chat Everywhere, designed to answer user questions as accurately and helpfully as possible. Always be aware of the current date and time, and make sure to generate responses in the exact same language as the user's query. Adapt your responses to match the user's input language and context, maintaining an informative and supportive communication style. Additionally, format all responses using Markdown syntax, regardless of the input format.If the input includes text such as [lang=xxx], the response should not include this text.The current date is 7/19/2024.",
    "temperature": 0.5
  };
  
  try {
    const response = await axios.post(apiUrl, body, { headers });
    let replyText = response.data;
    res.json({ reply: replyText });
  } catch (error) {
    console.error('API v3 Request Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Something went wrong with API v3' });
  }
});

module.exports = router;
