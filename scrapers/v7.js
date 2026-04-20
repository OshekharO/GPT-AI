const express = require('express');
const axios = require('axios');

const router = express.Router();

// API Route v7 - freedomgpt.com
router.post('/', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://chat.freedomgpt.com/api/gemini';
  const headers = {
    'content-type': 'application/json',
    // need to change authorization key frequently
    'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxNTQwYWM3MWJiOTJhYTA2OTNjODI3MTkwYWNhYmU1YjA1NWNiZWMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU2Frc2hhbSBTaGVraGVyIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0laVGJCWjdpcEs4aWFubktBSGNfem9zOVdYOU1tVVVNdG9YeG9XY0JteXd4U251cTNuPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2ZyZWVkb20tZ3B0IiwiYXVkIjoiZnJlZWRvbS1ncHQiLCJhdXRoX3RpbWUiOjE3MjEyNzU1NTcsInVzZXJfaWQiOiJqUEhxVlYxbG9BWHhDeTlXdmdzMDNWc0lrZ2oxIiwic3ViIjoialBIcVZWMWxvQVh4Q3k5V3ZnczAzVnNJa2dqMSIsImlhdCI6MTcyMTM1NDUwNCwiZXhwIjoxNzIxMzU4MTA0LCJlbWFpbCI6Im9tZWVwZDAwOUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExODI5Nzk5ODcxOTEyMDIwMzc5NiJdLCJlbWFpbCI6WyJvbWVlcGQwMDlAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.hqArMQbO5GGrmRdGNB7sCHAApT4smVcyRQTHD1cCf1OvdRbqezOXePUutval4bH298pYaj1s1xelWUGmO1TpMxxu--tEBqUzMoBOARFrFU2rrN48ElYo9NZD6vtkEgpRnEMIWliMj7WklS6ih9eTwH5Tzp3EDVQZ9iAuWtVqe2tlrLSFsBu6hfT86yyWiTFKu8tdrM-rTP0ieCJ_TuqIElxwvoV78SBPr9NFOTw4WEz80vpXIcs3-joam34npNOa__xzlvJOoW6GZHbmKvZUodsxP7_6zmDKL0bNxIAlvfsj83PQg1-gJ5KLwEeHCxGvwpWDQHCUVTNIIb7NIZKtsQ',
    'referer': 'https://chat.freedomgpt.com/',
    'origin': 'https://chat.freedomgpt.com'
  };
  const body = {
    "model": {
      "defaultSummaryPrompt": "You are an expert in summarizing chat transcripts.\n      Your goal is to create a summary of the transcript.\n\n      Below you find the transcript of the chat:\n      --------\n      {transcript}\n      --------\n\n      Total output will be a summary of the transcript.",
      "type": [
        "text"
      ],
      "enabled": true,
      "description": "Google Gemini Pro",
      "defaultPrompt": "Follow the user's instructions carefully.",
      "endpoint": "api/gemini",
      "hasInfiniteMode": true,
      "isNew": false,
      "tokenLimit": 4000,
      "maxLength": 12000,
      "firstMessageCost": 8,
      "name": "Google Gemini",
      "inputCost": 0.002,
      "image": "https://firebasestorage.googleapis.com/v0/b/freedom-gpt.appspot.com/o/000freedomgpt_models%2F5f112c652762100f2cd30c6ea6282c76.png?alt=media&token=2f83df23-e173-40c1-8f62-149a37c31170&_gl=1*17qwr7d*_ga*MTEzMTE1OTY3LjE2Nzc1MjI4MDE.*_ga_CW55HF8NVT*MTY5OTM4OTM4MC40MjkuMS4xNjk5Mzg5MzkyLjQ4LjAuMA..",
      "hasSettings": true,
      "tags": [
        "all"
      ],
      "outputCost": 0.004,
      "id": "gemini"
    },
    "prompt": "Follow the user's instructions carefully.",
    "question": userMessage,
    "messages": [
      {
        "role": "user",
        "content": userMessage
      }
    ]
  };

  try {
    const response = await axios.post(apiUrl, body, { headers });
    let replyText = response.data;
    res.json({ reply: replyText });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Something went wrong with authorization key' });
  }
});

module.exports = router;
