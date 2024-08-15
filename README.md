# GPT AI

A versatile Node.js server that integrates multiple chatbot APIs, offering a unified interface for various AI conversation models.

## 📚 Table of Contents
- [Features](#-features)
- [API Usage](#-api-usage)
- [Technologies](#-technologies)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🌟 Features

- Seamless integration of multiple chatbot APIs (v1 to v12)
- Built with Express.js for robust server-side operations
- Cross-Origin Resource Sharing (CORS) enabled for web application compatibility
- Straightforward error handling for improved debugging

## 🔧 API Usage

### Send a Message to the Chatbot

Send a POST request to the `/chat/v5` endpoint to interact with the chatbot.

#### Endpoint

```
POST http://localhost:3000/chat/v5
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
curl -X POST http://localhost:3000/chat/v5 \
     -H "Content-Type: application/json" \
     -d '{"userMessage": "Hello, how are you?"}'
```

#### Example Response

```json
{
  "reply": "Hello! As an AI language model, I don't have feelings, but I'm functioning well and ready to assist you. How can I help you today?"
}
```

## 🛠️ Technologies

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web application framework
- [Axios](https://axios-http.com/) - Promise-based HTTP client

## 🤝 Contributing

We welcome contributions, issues, and feature requests! Check out our [issues page](https://github.com/OshekharO/GPT-AI/issues) to get started.

## 📝 License

This project is open source and available under the [GPL-3.0](LICENSE.md).

## 📞 Contact

Your Name
- GitHub: [@OshekharO](https://github.com/OshekharO)
- Telegram: [@OshekherO](https://t.me/OshekherO)

---

⭐️ If you find this project helpful, please consider giving it a star on GitHub!
