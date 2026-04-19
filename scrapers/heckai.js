const express = require('express');
const axios = require('axios');

const router = express.Router();

// Route heckai
router.post('/', async (req, res) => {
  const { 
    userMessage,
    type = "chat",
    model = 1,
    lang = "English",
    prev_answer = null,
    prev_question = null
  } = req.body;

  const apiBaseUrl = 'https://api.heckai.weight-wave.com/api/ha/v1';
  const headers = {
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9',
    'authorization': '',
    'content-type': 'application/json',
    'origin': 'https://heck.ai',
    'referer': 'https://heck.ai/',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  };

  const modelList = {
    1: "google/gemini-2.0-flash-001",
    2: "deepseek/deepseek-r1",
    3: "openai/gpt-4o-mini",
    4: "deepseek/deepseek-chat",
    5: "x-ai/grok-3-mini-beta",
    6: "openai/gpt-4.1-mini",
    7: "meta-llama/llama-4-scout"
  };

  if (!userMessage) {
    return res.status(400).json({ 
      error: "Message content is required" 
    });
  }

  try {
    const parseData = (input) => {
      const get = (start, end) => {
        const lines = input.split("\n").map(line => {
          const content = line.slice(6);
          return content ? content : "\n";
        });
        const i = lines.indexOf(start),
              j = lines.indexOf(end);
        return i >= 0 && j > i ? lines.slice(i + 1, j).join("") : null;
      };
      
      const answer = get("[ANSWER_START]", "[ANSWER_DONE]");
      const related = get("[RELATE_Q_START]", "[RELATE_Q_DONE]");
      let source = [];
      try {
        source = JSON.parse(get("[SOURCE_START]", "[SOURCE_DONE]") || "[]");
      } catch {}
      
      return {
        answer: answer,
        related: related,
        source: source
      };
    };

    // Create session
    const slugTitle = `${userMessage?.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toLocaleDateString()}`;
    const sessionResponse = await axios.post(`${apiBaseUrl}/session/create`, {
      title: slugTitle
    }, { headers });
    
    const sessionId = sessionResponse.data?.id;
    if (!sessionId) throw new Error('Failed to create session');

    // Get selected model
    const modelName = modelList[model];
    if (!modelName) {
      const availableModels = Object.entries(modelList)
        .map(([id, name]) => `${id}. ${name}`)
        .join(", ");
      throw new Error(`Invalid model. Available models: ${availableModels}`);
    }

    // Make the chat request
    const chatResponse = await axios.post(`${apiBaseUrl}/${type}`, {
      model: modelName,
      question: userMessage,
      language: lang,
      sessionId: sessionId,
      previousQuestion: prev_question,
      previousAnswer: prev_answer
    }, { headers });

    const result = parseData(chatResponse.data);
    
    res.json({
      reply: result.answer,
      related_questions: result.related,
      sources: result.source,
      model_used: modelName,
      session_id: sessionId
    });

  } catch (error) {
    console.error('HeckAI API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process HeckAI request',
      details: error.response?.data?.message || error.message,
      attempted_model: modelList[model] || `Unknown (ID: ${model})`
    });
  }
});

module.exports = router;
