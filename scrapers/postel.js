const express = require('express');
const axios = require('axios');

const router = express.Router();

const POSTEL_MAX_RETRIES = 3;
const POSTEL_RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API Route postel - postel.app chatgpt-alternative
router.post('/', async (req, res) => {
  const { userMessage, model = "gpt-4o", length = "medium" } = req.body;

  const apiUrl = 'https://www.postel.app/api/chatgpt-alternative/generate';
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://www.postel.app',
    'Origin': 'https://www.postel.app'
  };

  if (!userMessage) {
    return res.status(400).json({ error: "Message content is required" });
  }

  let lastError;
  for (let attempt = 1; attempt <= POSTEL_MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(apiUrl, {
        prompt: userMessage,
        model: model,
        length: length
      }, { headers });

      const data = response.data;

      const rawReply = (data && typeof data === 'object') ? (data?.text ?? data) : data;
      const reply = typeof rawReply === 'string' ? rawReply : JSON.stringify(rawReply);
      const wordCount = typeof data?.wordCount === 'number'
        ? data.wordCount
        : (reply.trim() ? reply.trim().split(/\s+/).length : 0);

      return res.json({
        reply,
        wordCount,
        model: data?.model || model,
        api: "Postel"
      });

    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      if (status === 429 && attempt < POSTEL_MAX_RETRIES) {
        const delay = POSTEL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`Postel API rate limited (429). Retrying attempt ${attempt + 1}/${POSTEL_MAX_RETRIES} after ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      break;
    }
  }

  console.error('Postel API Error:', lastError.response ? lastError.response.data : lastError.message);
  const upstreamStatus = lastError.response?.status;
  const httpStatus = upstreamStatus === 429 ? 429 : 500;

  res.status(httpStatus).json({
    error: 'Failed to process Postel request',
    details: lastError.response?.data?.message || lastError.message
  });
});

module.exports = router;
