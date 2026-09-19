# GPT AI

A versatile Node.js server that integrates multiple chatbot APIs, offering a unified interface for various AI conversation models.

## 📚 Table of Contents
- [Features](#-features)
- [API Usage](#-api-usage)
- [Conversation Memory & System Prompts](#-conversation-memory--system-prompts)
- [Available Endpoints](#-available-endpoints)
- [Technologies](#-technologies)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🌟 Features

- Seamless integration of multiple chatbot APIs (v1 to v15)
- **Built-in Conversation Memory Management:** Automatically maintains context across multi-turn chats using sliding window message trimming and token estimation without exceeding upstream limits
- **System Prompt Support:** Preserves `system` and `developer` instructions at the top of conversation context
- Built with Express.js for robust server-side operations
- Cross-Origin Resource Sharing (CORS) enabled for web application compatibility
- Straightforward error handling for improved debugging

## 🔧 API Usage

### Send a Single Message

Send a POST request to any `/chat/vN` endpoint with `userMessage`.

```bash
curl -X POST http://localhost:3000/chat/v1 \
     -H "Content-Type: application/json" \
     -d '{"userMessage": "Hello, how are you?"}'
```

Response:
```json
{
  "reply": "Hello! I am ready to assist you. How can I help you today?"
}
```

## 🧠 Conversation Memory & System Prompts

Endpoints support multi-turn conversation memory and system instructions by sending a `messages` array in the request body.

### Request Body with System Prompt & Multi-Turn History

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant specialized in JavaScript."
    },
    {
      "role": "user",
      "content": "What is array destructuring in JS?"
    },
    {
      "role": "assistant",
      "content": "Array destructuring allows unpacking values from arrays into distinct variables."
    },
    {
      "role": "user",
      "content": "Can you give a quick example?"
    }
  ]
}
```

### How Memory Management Works
- **System Instructions Preservation:** Initial `system` or `developer` messages are retained at the start of the context payload.
- **Sliding Window Trimming:** Older conversation turns are automatically trimmed using sliding window logic based on maximum message count and token estimation (`utils/memory.js`).
- **Token Efficiency:** Ensures long multi-turn conversations do not consume excessive tokens or cause context overflow errors on upstream endpoints.

## 🌐 Available Endpoints

| Endpoint | Backed By | Model / Notes |
|----------|-----------|---------------|
| `/chat/v1` | [pollinations.ai](https://gen.pollinations.ai) | Pollinations Gen AI (Supports Memory & System Prompts) |
| `/chat/v2` | [openrouter.ai](https://openrouter.ai) | OpenRouter models (Supports Memory & System Prompts) |
| `/chat/v3` | [ai.riple.org](https://ai.riple.org/) | Riple AI / SAANVI (Supports Memory & System Prompts) |
| `/chat/v4` | [unlimitedai.chat](https://app.unlimitedai.chat) | Reasoning model |
| `/chat/v5` | [goody2.ai](https://www.goody2.ai) | Goody2 AI |
| `/chat/v6` | Chat Smith | gpt-4o-mini / Vulcan Labs (Supports Memory & System Prompts) |
| `/chat/v7` | [freedomgpt.com](https://chat.freedomgpt.com) | Weaver / FreedomGPT (Supports Memory & System Prompts) |
| `/chat/v8` | [chatwithfiction.com](https://www.chatwithfiction.com) | Chat with Fiction |
| `/chat/v9` | [bookai.chat](https://bookai.chat) | GPT-3.5 Turbo |
| `/chat/v10` | [publicai.co](https://publicai.co) | PublicAI (Supports Memory & System Prompts) |
| `/chat/v11` | [supabase.co](https://supabase.co) | gpt-5-nano |
| `/chat/v12` | [api.airforce](https://api.airforce) | llama-instant (Supports Memory & System Prompts) |
| `/chat/v13` | [supabase.co](https://supabase.co) | gpt-5-mini |
| `/chat/v14` | [chataibot.ru](https://chataibot.ru) | Chataibot |
| `/chat/v15` | [beta.dopple.ai](https://beta.dopple.ai/) | Dopple AI |

## 🛠️ Technologies

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web application framework
- [Axios](https://axios-http.com/) - Promise-based HTTP client

## 🤝 Contributing

We welcome contributions, issues, and feature requests! Check out our [issues page](https://github.com/OshekharO/GPT-AI/issues) to get started.

## 📝 License

This project is open source and available under the [GPL-3.0](LICENSE).

## 📞 Contact

- GitHub: [@OshekharO](https://github.com/OshekharO)
- Telegram: [@OshekherO](https://t.me/OshekherO)

---

⭐️ If you find this project helpful, please consider giving it a star on GitHub!
