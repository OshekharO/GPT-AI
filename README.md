# GPT AI

A versatile Node.js server that integrates multiple chatbot APIs, offering a unified interface for various AI conversation models.

## 📚 Table of Contents
- [Features](#-features)
- [API Usage](#-api-usage)
- [Available Endpoints](#-available-endpoints)
- [Technologies](#-technologies)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🌟 Features

- Seamless integration of multiple chatbot APIs (v1 to v13)
- Built with Express.js for robust server-side operations
- Cross-Origin Resource Sharing (CORS) enabled for web application compatibility
- Straightforward error handling for improved debugging

## 🔧 API Usage

### Send a Message to the Chatbot

Send a POST request to any `/chat/vN` endpoint to interact with the chatbot.

#### Endpoint

```
POST http://localhost:3000/chat/v1
```

#### Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "userMessage": "Hello, how are you?"
}
```

#### Example Using cURL

```bash
curl -X POST http://localhost:3000/chat/v1 \
     -H "Content-Type: application/json" \
     -d '{"userMessage": "Hello, how are you?"}'
```

#### Example Response

```json
{
  "reply": "Hello! As an AI language model, I don't have feelings, but I'm functioning well and ready to assist you. How can I help you today?"
}
```

## 🌐 Available Endpoints

| Endpoint | Backed By | Model / Notes |
|----------|-----------|---------------|
| `/chat/v1` | [notegpt.io](https://notegpt.io) | GPT-4.1 mini |
| `/chat/v2` | [ansari.chat](https://ansari.chat) | — |
| `/chat/v3` | [chateverywhere.app](https://chateverywhere.app) | GPT-3.5 Turbo |
| `/chat/v4` | [unlimitedai.chat](https://app.unlimitedai.chat) | Reasoning model |
| `/chat/v5` | [goody2.ai](https://www.goody2.ai) | — |
| `/chat/v6` | [pinoygpt.com](https://www.pinoygpt.com) | — |
| `/chat/v7` | [freedomgpt.com](https://chat.freedomgpt.com) | Gemini |
| `/chat/v8` | [chatwithfiction.com](https://www.chatwithfiction.com) | — |
| `/chat/v9` | [bookai.chat](https://bookai.chat) | GPT-3.5 Turbo |
| `/chat/v10` | [chataibot.ru](https://chataibot.ru) | — |
| `/chat/v11` | [qcpujeurnkbvwlvmylyx.supabase.co](https://qcpujeurnkbvwlvmylyx.supabase.co) | GPT-5-nano |
| `/chat/v12` | [phind.com](https://www.phind.com) | Phind Model |
| `/chat/v13` | [open-gpt.app](https://open-gpt.app) | — |

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
