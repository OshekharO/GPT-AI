const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v12 - Phind
router.post('/v12', async (req, res) => {
  const { userMessage, systemPrompt = "Be Helpful and Friendly", model = "Phind Model" } = req.body;

  const apiUrl = 'https://https.extension.phind.com/agent/';
  
  if (!userMessage) {
    return res.status(400).json({ 
      error: "Message content is required" 
    });
  }

  const headers = {
    'content-type': 'application/json',
    'user-agent': '',
    'accept': '*/*',
    'accept-encoding': 'identity'
  };

  const payload = {
    additional_extension_context: "",
    allow_magic_buttons: true,
    is_vscode_extension: true,
    message_history: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    requested_model: model,
    user_input: userMessage
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers });
    
    // Process the stream response
    const rawData = response.data;
    const result = rawData.split("\n")
      .filter(line => line.trim().startsWith("data:"))
      .map(line => {
        try {
          return JSON.parse(line.slice(5).trim());
        } catch {
          return null;
        }
      })
      .filter(item => item?.choices?.[0]?.delta?.content)
      .map(item => item.choices[0].delta.content)
      .join("");

    if (!result) {
      throw new Error('No valid response content received');
    }

    res.json({ 
      reply: result,
      model_used: model,
      response_type: 'stream_processed'
    });

  } catch (error) {
    console.error('Phind API Error:', error.response ? error.response.data : error.message);
    
    res.status(500).json({ 
      error: 'Failed to process Phind request',
      details: error.response?.data?.message || error.message,
      attempted_model: model
    });
  }
});

module.exports = router;
