const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API Route v1 - vtlchat-g1.vercel.app
app.post('/chat/v1', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://vtlchat-g1.vercel.app/api/openai/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    'Origin': 'https://vtlchat-g1.vercel.app',
    'Referer': 'https://vtlchat-g1.vercel.app/'
  };
  const body = {
    "messages": [
      {
        "role": "system",
        "content": "\nYou are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2021-09\nCurrent model: gpt-3.5-turbo\nCurrent time: " + new Date().toLocaleString() + "\nLatex inline: $x^2$ \nLatex block: $$e=mc^2$$\n\n"
      },
      {
        "role": "user",
        "content": userMessage
      }
    ],
    "stream": true,
    "model": "gpt-3.5-turbo",
    "temperature": 0.5,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "top_p": 1
  };

  try {
    const response = await axios.post(apiUrl, body, { headers });
    const chunks = response.data.split("\n\n");
    let reply = "";
    chunks.forEach(chunk => {
      if (chunk.startsWith('data: ')) {
        const data = JSON.parse(chunk.substring(6));
        if (data.choices && data.choices[0].delta.content) {
          reply += data.choices[0].delta.content;
        }
      }
    });
    res.json({ reply });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API Route v2 - gpt4login.com
app.post('/chat/v2', async (req, res) => {
  const { userMessage } = req.body;

  const apiUrl = 'https://gpt4login.com/wp-admin/admin-ajax.php';
  const headers = {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://gpt4login.com',
            '_gid': 'GA1.2.580936514.1720892371',
            '_gat_gtag_UA_265197079_1': '1',
            '_ga_W925DX246W': 'GS1.1.1720892371.1.0.1720892371.0.0.0',
            '_ga': 'GA1.1.2083846270.1720892371',
            '_utmz': '1.1720892371.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)',
            '__gads': 'ID=178d31514647a4c6:T=1720892371:RT=1720892371:S=ALNI_MYCflfiXBU1CrRgHFVKVDTRAahzWw',
            '__gpi': 'UID=00000e8ff7f8cced:T=1720892371:RT=1720892371:S=ALNI_MZekr5ROZjTxvcX3EQoHTfDCkM57w',
            '_fbp': 'fb.1.1720892371182.1313744528',
            '_eoi': 'ID=cb0d1f51ff419903:T=1720892371:RT=1720892371:S=AA-AfjYM6fsP6Ws6mjD_b10s-rbe',
            'FCNEC': '%5B%5B%22AKsRol-u8Q4eBXRqLcdljA6Q1pYefHaXOEuEXP0lfrZxIMoF3weziUX9CXTMxhBpFxet1slsQlB-rMmHb42zu7o38r-L6L0uO4jkvt__7jVMNu8iVf5mDKkBx5tbsoM-E2OLTJVtXIiS7RqlwIFZyRFOhjm2Mhr3cg%3D%3D%22%5D%5D',
            'PHPSESSID': 'd8f90c2b4d659feacfe18e2eeabba60b'
        };
  const body = new URLSearchParams({
    action: 'chatbot_chatgpt_send_message',
    message: userMessage,
    user_id: '0',
    page_id: '27'
  });

  try {
    const response = await axios.post(apiUrl, body, { headers });
    res.json(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
