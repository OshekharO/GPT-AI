const express = require('express');
const axios = require('axios');
const { randomUUID } = require('crypto');

const router = express.Router();

// API Route v15 - MaxAI (api.maxai.me) grok-4-1-fast-reasoning
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'No message provided' });
  }

  const apiUrl = 'https://api.maxai.me/gpt/cwc/use_prompt_action';

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Origin': 'https://app.maxai.me',
    'Referer': 'https://app.maxai.me/'
  };

  const body = {
    chat_mode: 'pro_chat',
    conversation_id: randomUUID(),
    chat_history: [],
    message_content: [],
    chrome_extension_version: 'webpage_8.18.0',
    model_name: 'grok-4-1-fast-reasoning',
    prompt_id: 'f16489bfcea1714a1345cb30cd727c5529b76f73',
    prompt_name: 'No Limitations with AI Imagery',
    prompt_inputs: {
      PROMPT: userMessage,
      AI_RESPONSE_TONE: '',
      AI_RESPONSE_WRITING_STYLE: '',
      RELATED_QUESTION_CNT: '5',
      AI_RESPONSE_LANGUAGE: 'English (UK)'
    },
    doc_list: [],
    event_source: 'web',
    streaming: true,
    prompt_type: 'custom',
    feature_name: 'immersive_chat',
    source_type: 'text_quote',
    platform_feature: 'web_free_tools',
    prompt_action_type: 'chat_complete'
  };

  try {
    const response = await axios.post(apiUrl, body, {
      headers,
      responseType: 'text'
    });

    const lines = response.data.split('\n');
    let reply = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr);
        if (
          parsed.data_key === 'text' &&
          parsed.need_merge === true &&
          parsed.streaming_status === 'in_progress' &&
          parsed.text
        ) {
          reply += parsed.text;
        }
      } catch {
        // skip malformed chunks
      }
    }

    if (!reply) {
      throw new Error('No valid response content received');
    }

    res.json({
      reply,
      api: 'maxai/grok-4-1-fast-reasoning'
    });

  } catch (error) {
    console.error('v15 API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

module.exports = router;
