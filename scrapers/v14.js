const express = require('express');
const axios = require('axios');

const router = express.Router();

const PIZZAGPT_BASE = 'https://www.pizzagpt.it';

async function handleV14(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const rawMessage = source.userMessage;
  const userMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  const model = source.model || 'gpt-5-mini';

  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-store');
  }

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  try {
    // Step 1: fetch CSRF token
    const csrfRes = await axios.get(`${PIZZAGPT_BASE}/api/csrf-token`, {
      headers: {
        'Accept': 'application/json',
        'Referer': `${PIZZAGPT_BASE}/en`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    const csrfToken = csrfRes.data?.token;
    if (!csrfToken) {
      return res.status(500).json({ error: 'Failed to retrieve CSRF token from PizzaGPT' });
    }

    // Step 2: send chat request
    const chatPayload = {
      question: userMessage,
      model,
      searchEnabled: false,
      studyMode: false,
      chat: [
        { text: 'Ciao, come posso aiutarti oggi?', sender: 'assistant' },
        { text: userMessage, sender: 'user', studyMode: false }
      ],
      posthogId: csrfToken
    };

    const chatRes = await axios.post(`${PIZZAGPT_BASE}/api/chat`, chatPayload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': `${PIZZAGPT_BASE}/en`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-Secret': csrfToken
      }
    });

    const reply = chatRes.data?.content || chatRes.data;

    res.json({
      reply,
      api: 'PizzaGPT'
    });
  } catch (error) {
    console.error('PizzaGPT API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: error.response?.data?.message || 'Something went wrong with PizzaGPT API'
    });
  }
}

router.get('/', handleV14);
router.post('/', handleV14);

module.exports = router;
