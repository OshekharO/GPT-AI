const express = require('express');
const axios = require('axios');

const router = express.Router();

/**
 * Extracts and cleans text content from diverse model response structures.
 * Removes thinking/reasoning tags like <think>...</think> if present.
 */
function extractReply(data) {
  if (!data) return '';

  let rawContent = '';

  if (Array.isArray(data.choices) && data.choices.length > 0) {
    const choice = data.choices[0];
    if (choice.message) {
      if (typeof choice.message.content === 'string') {
        rawContent = choice.message.content;
      } else if (Array.isArray(choice.message.content)) {
        rawContent = choice.message.content
          .map(part => (typeof part === 'string' ? part : part.text || ''))
          .join('');
      } else if (choice.message.content && typeof choice.message.content === 'object') {
        rawContent = choice.message.content.text || JSON.stringify(choice.message.content);
      }
    } else if (choice.text && typeof choice.text === 'string') {
      rawContent = choice.text;
    } else if (choice.delta && choice.delta.content) {
      rawContent = typeof choice.delta.content === 'string'
        ? choice.delta.content
        : JSON.stringify(choice.delta.content);
    }
  }

  if (!rawContent) {
    if (typeof data.content === 'string') {
      rawContent = data.content;
    } else if (typeof data.reply === 'string') {
      rawContent = data.reply;
    } else if (typeof data === 'string') {
      rawContent = data;
    } else {
      const str = JSON.stringify(data);
      const match = str.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (match && match[1]) {
        try {
          rawContent = JSON.parse(`"${match[1]}"`);
        } catch (_) {
          rawContent = match[1];
        }
      }
    }
  }

  // Remove <think>...</think> reasoning blocks if present
  let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  return cleaned || rawContent.trim();
}

const AVAILABLE_MODELS = [
  'openai/gpt-5.4-nano',
  'openai',
  'openai/gpt-oss-20b',
  'community/AkshayCoder48/v3',
  'community/Lorodn4x/deepseek-v4-flash',
  'x-ai/grok-4.20',
  'qwen/qwen3.8-2.4t-a95b'
];

async function handleV10(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { userMessage, messages, model, reasoning_effort = 'medium', ...rest } = source || {};

  const selectedModel = model || AVAILABLE_MODELS[Math.floor(Math.random() * AVAILABLE_MODELS.length)];

  const rawMessage = userMessage;
  const msgStr = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  let messagesToSend = Array.isArray(messages) ? [...messages] : [];

  if (msgStr && typeof msgStr === 'string') {
    messagesToSend.push({
      role: 'user',
      content: msgStr
    });
  }

  if (messagesToSend.length === 0) {
    return res.status(400).json({
      error: 'Message content is required (userMessage or messages array)'
    });
  }

  const authHeader = req.headers.authorization;
  const envKey = process.env.POLLINATIONS_API_KEY || process.env.V10_API_KEY;
  const apiKey = authHeader || (envKey ? (envKey.startsWith('Bearer ') ? envKey : `Bearer ${envKey}`) : null);

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required. Provide Authorization header or set POLLINATIONS_API_KEY env variable.'
    });
  }

  const headers = {
    'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    model: selectedModel,
    messages: messagesToSend,
    ...(reasoning_effort !== undefined && { reasoning_effort }),
    ...rest
  };

  const apiUrl = 'https://gen.pollinations.ai/v1/chat/completions';

  try {
    const response = await axios.post(apiUrl, payload, { headers });

    const reply = extractReply(response.data);

    if (!reply) {
      throw new Error('No valid response content received from Pollinations');
    }

    res.json({
      reply,
      model: response.data?.model || selectedModel
    });

  } catch (error) {
    console.error('Pollinations v10 API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: 'Failed to process Pollinations request',
      details: error.response?.data?.error?.message || error.message
    });
  }
}

router.get('/', handleV1);
router.post('/', handleV1);

module.exports = router;
