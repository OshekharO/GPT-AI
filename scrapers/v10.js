const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Magic value required by the notegpt.io sbox-guid cookie field
const NOTEGPT_SBOX_MAGIC = '907803882';
// 30 days in seconds, used for the _ga cookie's creation-time offset
const NOTEGPT_GA_OFFSET_SECONDS = 2592000;

// WASM initialization and signing logic
let wasmExports = null;
let heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);
let heap_next = heap.length;

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}

function getObject(idx) { return heap[idx]; }
function isNil(e) { return e == null; }

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

function getStringFromWasm(ptr, len) {
  return decoder.decode(new Uint8Array(wasmExports.memory.buffer).subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;
function passStringToWasm(arg, malloc, realloc) {
  const buf = encoder.encode(arg);
  const ptr = malloc(buf.length, 1) >>> 0;
  new Uint8Array(wasmExports.memory.buffer).subarray(ptr, ptr + buf.length).set(buf);
  WASM_VECTOR_LEN = buf.length;
  return ptr;
}

function getMemoryBuffer() {
  return new Uint8Array(wasmExports.memory.buffer);
}

function getSubarray(ptr, len) {
  ptr >>>= 0;
  return getMemoryBuffer().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataView = null;
function getDataView() {
  if (cachedDataView === null || cachedDataView.buffer.detached === true || (cachedDataView.buffer.detached === undefined && cachedDataView.buffer !== wasmExports.memory.buffer)) {
    cachedDataView = new DataView(wasmExports.memory.buffer);
  }
  return cachedDataView;
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addHeapObject(e);
    wasmExports.__wbindgen_exn_store(idx);
  }
}

const fakeWindow = {
  HTMLElement: class HTMLElement {},
  Window: class Window {},
  self: {},
  document: {
    createElement: () => ({
      appendChild: () => {},
      removeChild: () => {},
      setAttribute: () => {},
      id: '',
      innerHTML: '',
      children: []
    }),
    documentElement: {},
    body: {}
  },
  location: { href: 'https://notegpt.io/ai-chat' },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' },
  getComputedStyle: () => ({ getPropertyValue: () => '' })
};
fakeWindow.self = fakeWindow;

const importsMap = {
  __wbg_crypto_38df2bab126b63dc: (e) => { const obj = getObject(e); return addHeapObject((obj && obj.crypto) || globalThis.crypto || crypto.webcrypto); },
  __wbg_process_44c7a14e11e9f69e: (e) => { const obj = getObject(e); const p = obj ? obj.process : undefined; return isNil(p) ? 0 : addHeapObject(p); },
  __wbg_versions_276b2795b1c6a219: (e) => { const obj = getObject(e); const v = obj ? obj.versions : undefined; return isNil(v) ? 0 : addHeapObject(v); },
  __wbg_node_84ea875411254db1: (e) => { const obj = getObject(e); return addHeapObject(obj ? obj.node : undefined); },
  __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(() => addHeapObject(require), arguments); },
  __wbg_call_1aea13500fe8ff6c: function() { return handleError((e, t, n) => getObject(e).call(getObject(t), getObject(n)), arguments); },
  __wbg_msCrypto_bd5a034af96bcba6: (e) => { const obj = getObject(e); return addHeapObject(obj ? obj.msCrypto : undefined); },
  __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError((e, t) => getObject(e).randomFillSync(getObject(t)), arguments); },
  __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError((e, t) => getObject(e).getRandomValues(getObject(t)), arguments); },
  __wbg_instanceof_Window_4bfad3a9470c25c9: (e) => { try { return getObject(e) instanceof fakeWindow.Window; } catch { return false; } },
  __wbg_getComputedStyle_54985c5cd0d50b68: function() { return handleError((e, t) => { const res = getObject(e).getComputedStyle(getObject(t)); return isNil(res) ? 0 : addHeapObject(res); }, arguments); },
  __wbg_document_8d00b6db6f4e3e5e: (e) => { const obj = getObject(e); const doc = obj ? obj.document : undefined; return isNil(doc) ? 0 : addHeapObject(doc); },
  __wbg_location_bb43558c9f37b0ca: (e) => { const obj = getObject(e); return addHeapObject(obj ? obj.location : undefined); },
  __wbg_navigator_cda717510f3a4a47: (e) => { const obj = getObject(e); return addHeapObject(obj ? obj.navigator : undefined); },
  __wbg_clientWidth_8043da2fcb723102: (e) => { const obj = getObject(e); return obj ? obj.clientWidth : 0; },
  __wbg_setAttribute_81f03c9a783fca26: function() { return handleError((e, t, n, r, i) => getObject(e).setAttribute(getStringFromWasm(t, n), getStringFromWasm(r, i)), arguments); },
  __wbg_set_innerHTML_fb75cf5a1a8b7074: (e, t, n) => { const obj = getObject(e); if (obj) obj.innerHTML = getStringFromWasm(t, n); },
  __wbg_set_id_e047efbc2bf2e248: (e, t, n) => { const obj = getObject(e); if (obj) obj.id = getStringFromWasm(t, n); },
  __wbg_children_9fc528ade3ea173f: (e) => { const obj = getObject(e); return addHeapObject(obj ? obj.children : undefined); },
  __wbg_createElement_22af76933a7b7e81: function() { return handleError((e, t, n) => addHeapObject(getObject(e).createElement(getStringFromWasm(t, n))), arguments); },
  __wbg_documentElement_f146626e6bc2f644: (e) => { const obj = getObject(e); const doc = obj ? obj.documentElement : undefined; return isNil(doc) ? 0 : addHeapObject(doc); },
  __wbg_body_36314a75ae5381db: (e) => { const obj = getObject(e); const body = obj ? obj.body : undefined; return isNil(body) ? 0 : addHeapObject(body); },
  __wbg_instanceof_HtmlElement_51b34b7de7e6e993: (e) => { try { return getObject(e) instanceof fakeWindow.HTMLElement; } catch { return false; } },
  __wbg_getPropertyValue_60177298ed778c76: function() { return handleError((e, t, n, r) => {
    const val = getObject(t).getPropertyValue(getStringFromWasm(n, r));
    const ptr = passStringToWasm(val, wasmExports.__wbindgen_malloc, wasmExports.__wbindgen_realloc);
    const len = WASM_VECTOR_LEN;
    getDataView().setInt32(e + 4, len, true);
    getDataView().setInt32(e + 0, ptr, true);
  }, arguments); },
  __wbg_appendChild_023bbb6d63210eba: function() { return handleError((e, t) => getObject(e).appendChild(getObject(t)), arguments); },
  __wbg_removeChild_5fbc36e12df0c63a: function() { return handleError((e, t) => addHeapObject(getObject(e).removeChild(getObject(t))), arguments); },
  __wbg_href_42d0a7d79a5a0fe5: function() { return handleError((e, t) => {
    const href = getObject(t).href;
    const ptr = passStringToWasm(href, wasmExports.__wbindgen_malloc, wasmExports.__wbindgen_realloc);
    const len = WASM_VECTOR_LEN;
    getDataView().setInt32(e + 4, len, true);
    getDataView().setInt32(e + 0, ptr, true);
  }, arguments); },
  __wbg_userAgent_6dfab2ad96d4e4e4: function() { return handleError((e, t) => {
    const ua = getObject(t).userAgent;
    const ptr = passStringToWasm(ua, wasmExports.__wbindgen_malloc, wasmExports.__wbindgen_realloc);
    const len = WASM_VECTOR_LEN;
    getDataView().setInt32(e + 4, len, true);
    getDataView().setInt32(e + 0, ptr, true);
  }, arguments); },
  __wbg_item_4ab2528204fdf759: (e, t) => { const obj = getObject(e); const res = obj ? obj.item(t >>> 0) : undefined; return isNil(res) ? 0 : addHeapObject(res); },
  __wbg_length_090b6aa6235450ba: (e) => { const obj = getObject(e); return obj ? obj.length : 0; },
  __wbg_prototypesetcall_7dca54d31cb9d2dc: (e, t, n) => Uint8Array.prototype.set.call(getSubarray(e, t), getObject(n)),
  __wbg_new_with_length_a90559ebda3954f8: (e) => addHeapObject(new Uint8Array(e >>> 0)),
  __wbg_subarray_fb60755cb1b4a498: (e, t, n) => addHeapObject(getObject(e).subarray(t >>> 0, n >>> 0)),
  __wbg_now_cd850b0a28a6e656: () => Date.now(),
  __wbg_new_0_1211b165db93342c: () => addHeapObject(new Date()),
  __wbg_getHours_defd69626029ce3f: (e) => { const obj = getObject(e); return obj ? obj.getHours() : 0; },
  __wbg_new_ebde992a0bf6bdf6: (e, t) => addHeapObject(new Error(getStringFromWasm(e, t))),
  __wbg_static_accessor_GLOBAL_THIS_13002645baf43d84: () => isNil(globalThis) ? 0 : addHeapObject(globalThis),
  __wbg_static_accessor_SELF_91d0abd4d035416c: () => isNil(fakeWindow.self) ? 0 : addHeapObject(fakeWindow.self),
  __wbg_static_accessor_GLOBAL_44bef9fa6011e260: () => isNil(global) ? 0 : addHeapObject(global),
  __wbg_static_accessor_WINDOW_513f857c65724fc7: () => isNil(fakeWindow) ? 0 : addHeapObject(fakeWindow),
  __wbg_random_d9645defc0204485: () => Math.random(),
  __wbg_get_d8a3d51a73d14c8a: function() { return handleError((e, t) => addHeapObject(Reflect.get(getObject(e), getObject(t))), arguments); },
  __wbg_has_509eb022105825c9: function() { return handleError((e, t) => Reflect.has(getObject(e), getObject(t)), arguments); },
  __wbg___wbindgen_throw_bd5a70920abf0236: (ptr, len) => { throw new Error(getStringFromWasm(ptr, len)); },
  __wbg___wbindgen_is_falsy_f8005c4864e74c90: (e) => !getObject(e),
  __wbg___wbindgen_is_object_e04e3a51a90cde43: (e) => typeof getObject(e) === 'object' && !!getObject(e),
  __wbg___wbindgen_is_string_3db04af369717583: (e) => typeof getObject(e) === 'string',
  __wbg___wbindgen_is_function_d4c2480b46f29e33: (e) => typeof getObject(e) === 'function',
  __wbg___wbindgen_is_undefined_5957b329897cc39c: (e) => getObject(e) === undefined,
  __wbindgen_init_externref_table: () => {},
  __wbindgen_cast_0000000000000001: (e, t) => addHeapObject(new Uint8Array(wasmExports.memory.buffer).subarray(e >>> 0, (e >>> 0) + t)),
  __wbindgen_cast_0000000000000002: (e, t) => getStringFromWasm(e, t)
};

async function initWasm() {
  if (wasmExports) return wasmExports;
  const wasmPath = path.join(__dirname, 'crypto_util_bg.wasm');
  const wasmBuf = fs.readFileSync(wasmPath);
  const wasmInst = await WebAssembly.instantiate(wasmBuf, { './crypto_util_bg.js': importsMap });
  wasmExports = wasmInst.instance.exports;
  wasmExports.__wbindgen_start();
  return wasmExports;
}

function signJS(appId, paramStr) {
  let n, r;
  try {
    let o = passStringToWasm(appId, wasmExports.__wbindgen_malloc, wasmExports.__wbindgen_realloc);
    let c = WASM_VECTOR_LEN;
    let l = passStringToWasm(paramStr, wasmExports.__wbindgen_malloc, wasmExports.__wbindgen_realloc);
    let u = WASM_VECTOR_LEN;
    let d = wasmExports.sign(o, c, l, u);
    var i = d[0], a = d[1];
    if (d[3]) throw new Error('WASM sign error');
    n = i; r = a;
    return getStringFromWasm(i, a);
  } finally {
    if (n !== undefined) wasmExports.__wbindgen_free(n, r, 1);
  }
}

function sortObjectKeys(e) {
  if (e === null) return String(e);
  if (Array.isArray(e)) return JSON.stringify(e);
  if (typeof e === 'object') {
    const sorted = {};
    for (const k of Object.keys(e).sort()) sorted[k] = e[k];
    return JSON.stringify(sorted);
  }
  return String(e);
}

function buildParamString(payload) {
  return Object.keys(payload)
    .filter(k => payload[k] !== undefined)
    .sort()
    .map(k => {
      const val = payload[k];
      return (val && typeof val === 'object') ? `${k}=${sortObjectKeys(val)}` : `${k}=${String(val)}`;
    })
    .join('&');
}

function notegptMakeCookie(nowSec) {
  const anonId = crypto.randomUUID();
  const sbox = Buffer.from(`${nowSec}|${NOTEGPT_SBOX_MAGIC}`).toString('base64');
  const gid = `GA1.2.${Math.floor(Math.random() * 1000000000)}.${nowSec}`;
  const ga = `GA1.2.${Math.floor(Math.random() * 1000000000)}.${nowSec - NOTEGPT_GA_OFFSET_SECONDS}`;
  return `anonymous_user_id=${anonId}; sbox-guid=${sbox}; _gid=${gid}; _ga=${ga}`;
}

async function handleV10(req, res) {
  const source = req.method === 'GET' ? req.query : req.body;
  const { lang, model, tone, length, convId, image_urls, chat_mode, enable_web_search, app_id, t, sign } = source || {};
  // Coerce userMessage to string to handle array values from repeated query params
  const rawMessage = source ? (source.userMessage || source.message || source.prompt || source.q) : undefined;
  const userMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-store');
  }

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message content is required and must be a string' });
  }

  const conversationId = convId || crypto.randomUUID();
  const timestamp = t ? Number(t) : Math.floor(Date.now() / 1000);
  const cookie = notegptMakeCookie(timestamp);

  const headers = {
    'authority': 'notegpt.io',
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://notegpt.io',
    'referer': 'https://notegpt.io/ai-chat',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'cookie': cookie
  };

  const appIdValue = app_id || 'notegpt_8c92b6';
  // NoteGPT uses numeric 1 for standard chat mode
  const chatModeValue = chat_mode === 'standard' || chat_mode === undefined ? 1 : chat_mode;

  const payload = {
    message: userMessage,
    language: lang || 'auto',
    model: model || 'gemini-3.1-flash-lite',
    tone: tone || 'default',
    length: length || 'moderate',
    conversation_id: conversationId,
    image_urls: Array.isArray(image_urls) ? image_urls : [],
    chat_mode: chatModeValue,
    enable_web_search: enable_web_search !== undefined ? Boolean(enable_web_search) : false,
    app_id: appIdValue,
    t: timestamp
  };

  try {
    await initWasm();
    const paramStr = buildParamString(payload);
    payload.sign = sign || signJS(appIdValue, paramStr);
  } catch (err) {
    console.error('WASM Sign Error:', err.message);
  }

  try {
    const response = await axios.post('https://notegpt.io/api/v2/chat/stream', payload, { headers, responseType: 'text' });

    let lineBuffer = response.data || '';

    // If response is a JSON error object instead of text/event-stream
    if (typeof lineBuffer === 'string' && lineBuffer.trim().startsWith('{')) {
      try {
        const jsonRes = JSON.parse(lineBuffer.trim());
        if (jsonRes.code && jsonRes.code !== 0 && jsonRes.message) {
          return res.status(500).json({
            error: jsonRes.message || 'NoteGPT API error',
            code: jsonRes.code
          });
        }
      } catch (_) {}
    }

    const texts = [];
    const reasonings = [];
    let newlineIdx;

    const parseData = (dataStr) => {
      if (!dataStr.trim()) return;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.done) return;
        if (parsed.text) {
          texts.push(parsed.text);
        }
        if (parsed.reasoning) {
          reasonings.push(parsed.reasoning);
        }
      } catch (parseErr) {
        console.error('NoteGPT SSE parse error:', parseErr.message, '| raw:', dataStr);
      }
    };

    while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
      const line = lineBuffer.slice(0, newlineIdx).trim();
      lineBuffer = lineBuffer.slice(newlineIdx + 1);
      if (line.startsWith('data:')) {
        parseData(line.slice(5).trim());
      }
    }

    if (lineBuffer.trim().startsWith('data:')) {
      parseData(lineBuffer.trim().slice(5).trim());
    }

    const replyText = texts.join('');
    const reasoningText = reasonings.join('');

    if (!replyText && !reasoningText) {
      return res.status(500).json({ error: 'NoteGPT returned no content' });
    }

    res.json({
      reply: replyText || reasoningText,
      ...(reasoningText && replyText ? { reasoning: reasoningText } : {}),
      conversation_id: conversationId,
      api: 'NoteGPT'
    });
  } catch (error) {
    console.error('NoteGPT API Error:', error.response ? error.response.data : error.message);
    if (res.headersSent) return;
    res.status(500).json({
      error: error.response?.data?.message || 'Something went wrong with NoteGPT API'
    });
  }
}

router.get('/', handleV10);
router.post('/', handleV10);

module.exports = router;
