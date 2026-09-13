const express = require('express');
const axios = require('axios');

const router = express.Router();

const CONFIG = {
  URL: {
    TOKEN: 'https://api.vulcanlabs.co/smith-auth/api/v1/token',
    CHAT: 'https://api.vulcanlabs.co/smith-v2/api/v7/chat_android'
  },
  DEVICE_ID: 'A718E10669C7C5F7',
  HEADERS: {
    'User-Agent': 'Chat Smith Android, Version 4.0.1(970)',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'Content-Type': 'application/json; charset=utf-8',
    'x-vulcan-application-id': 'com.smartwidgetlabs.chatgpt'
  }
};

async function getToken() {
  const payload = {
    device_id: CONFIG.DEVICE_ID,
    order_id: '',
    product_id: '',
    purchase_token: '',
    subscription_id: ''
  };

  const response = await axios.post(CONFIG.URL.TOKEN, payload, {
    headers: {
      ...CONFIG.HEADERS,
      'x-vulcan-request-id': '9149487891752494707093'
    }
  });

  return response.data;
}

// API Route v6 - Vulcan Labs / Chat Smith
router.post('/', async (req, res) => {
  const { userMessage, messages } = req.body || {};

  let messagesToSend = [];

  if (Array.isArray(messages) && messages.length > 0) {
    messagesToSend = [...messages];
  } else if (userMessage && typeof userMessage === 'string') {
    messagesToSend = [
      {
        role: 'system',
        content: 'You are Chat Smith, a personal AI. Your goal is to be useful, friendly, and fun.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
  }

  if (messagesToSend.length === 0) {
    return res.status(400).json({ error: 'Message content is required (userMessage or messages array)' });
  }

  try {
    const tokenData = await getToken();
    const accessToken = tokenData?.AccessToken || tokenData?.access_token || tokenData?.token;

    if (!accessToken) {
      throw new Error('Failed to retrieve access token from Chat Smith auth');
    }

    const payload = {
      usage_model: {
        provider: 'openai',
        model: 'gpt-4o-mini'
      },
      user: CONFIG.DEVICE_ID,
      messages: messagesToSend,
      nsfw_check: true,
      tools: [
        {
          function: {
            name: 'create_ai_art'
          }
        }
      ]
    };

    const response = await axios.post(CONFIG.URL.CHAT, payload, {
      headers: {
        ...CONFIG.HEADERS,
        'x-auth-token': 'A4gnMV1ReuPphVWC/az7HiXbdiG4lpynFp0GA1k6EJ3P1os8bLHiYgAwJZ8Hi80hDMLzxEWsn+srJ5CxEVHDU/mBrrfSVHV1MJhm9WKM4dTHOcCc4RMpHDEg5GTNPsS19bUFsm8IW/SH5eY+BIwgPg4P4JT41c1eC83swjZ3FVA=',
        'authorization': `Bearer ${accessToken}`,
        'x-firebase-appcheck-error': '-9%3A+Integrity+API+error...',
        'x-vulcan-request-id': '9149487891752494721341'
      }
    });

    const choice = response.data?.choices?.[0];
    const reply = choice?.Message?.content || choice?.message?.content || '';

    if (!reply) {
      throw new Error('No valid response content received from Chat Smith');
    }

    res.json({ reply });

  } catch (error) {
    console.error('API v6 Request Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Something went wrong with API v6' });
  }
});

module.exports = router;
