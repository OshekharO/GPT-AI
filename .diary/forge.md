## 2026-05-20 - Conversation Memory Management & Sliding Window Context Trimming

**Learning:** When scrapers forward multi-turn conversation `messages` arrays directly to upstream AI providers, unconstrained history easily causes token/context overflow errors or excessive latency. Implementing a sliding window memory trimmer that retains initial system instructions (`role: 'system'` / `'developer'`) while trimming older turns based on message count and estimated token limits keeps conversation context intact without consuming excessive tokens.

**Action:** Use `trimConversationHistory(messages, { maxMessages, maxTokens })` from `utils/memory.js` prior to sending payloads in multi-turn scrapers.
