const express = require('express');
const axios = require('axios');
const { addExtra } = require('puppeteer-extra');
const puppeteerCore = require('puppeteer-core');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const chromium = require('@sparticuz/chromium');

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());

const router = express.Router();

const PIZZAGPT_BASE = 'https://www.pizzagpt.it';
// CF clearance cache: reused within the same warm serverless container
let cfCache = null; // { cfClearance, userAgent, expiry }

async function getCfClearance() {
  if (cfCache && Date.now() < cfCache.expiry) {
    return cfCache;
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    const userAgent = await browser.userAgent();

    // Visit the main page — Cloudflare challenge is solved automatically by the stealth browser
    await page.goto(`${PIZZAGPT_BASE}/en`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait until CF finishes its challenge (title changes away from "Just a moment...")
    await page.waitForFunction(
      () => !document.title.includes('Just a moment'),
      { timeout: 30000 }
    ).catch(() => {});

    const cookies = await page.cookies();
    const cfCookie = cookies.find(c => c.name === 'cf_clearance');

    if (!cfCookie) {
      throw new Error('cf_clearance cookie not found after Cloudflare challenge');
    }

    cfCache = {
      cfClearance: cfCookie.value,
      userAgent,
      expiry: Date.now() + 25 * 60 * 1000, // cache for 25 minutes (CF cookie lasts ~30 min)
    };

    return cfCache;
  } finally {
    await browser.close();
  }
}

async function handleV14(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const rawMessage = source.userMessage;
  const userMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  const model = source.model || 'gpt-5-mini';

  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-store');
  }

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  try {
    const { cfClearance, userAgent } = await getCfClearance();

    const commonHeaders = {
      'User-Agent': userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': PIZZAGPT_BASE,
      'Referer': `${PIZZAGPT_BASE}/en`,
      'Cookie': `cf_clearance=${cfClearance}`,
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    };

    // Step 1: fetch CSRF token
    const csrfRes = await axios.get(`${PIZZAGPT_BASE}/api/csrf-token`, {
      headers: { ...commonHeaders, 'Accept': 'application/json' },
    });

    const csrfToken = csrfRes.data?.token;
    if (!csrfToken) {
      return res.status(500).json({ error: 'Failed to retrieve CSRF token from PizzaGPT' });
    }

    // Step 2: send chat request
    const chatPayload = {
      question: userMessage,
      model,
      searchEnabled: false,
      studyMode: false,
      chat: [
        { text: 'Ciao, come posso aiutarti oggi?', sender: 'assistant' },
        { text: userMessage, sender: 'user', studyMode: false },
      ],
      posthogId: csrfToken,
    };

    const chatRes = await axios.post(`${PIZZAGPT_BASE}/api/chat`, chatPayload, {
      headers: {
        ...commonHeaders,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Secret': csrfToken,
      },
    });

    const reply = chatRes.data?.content || chatRes.data;

    res.json({ reply, api: 'PizzaGPT' });
  } catch (error) {
    // Invalidate cache on CF-related errors so the next request re-solves the challenge
    if (error.response?.status === 403 || error.response?.status === 503) {
      cfCache = null;
    }
    console.error('PizzaGPT API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: error.response?.data?.message || 'Something went wrong with PizzaGPT API',
    });
  }
}

router.get('/', handleV14);
router.post('/', handleV14);

module.exports = router;
