const assert = require('assert');
const { estimateTokens, trimConversationHistory } = require('../utils/memory');

function testEstimateTokens() {
  assert.strictEqual(estimateTokens(''), 0);
  assert.strictEqual(estimateTokens(null), 0);
  assert.strictEqual(estimateTokens('12345678'), 2); // 8 chars / 4 = 2

  const msg = { role: 'user', content: 'hello world' };
  assert.strictEqual(estimateTokens(msg), 7);

  const msgParts = { role: 'user', parts: [{ type: 'text', text: 'hello' }] };
  assert(estimateTokens(msgParts) > 0);

  console.log('✓ testEstimateTokens passed');
}

function testTrimConversationHistoryMessageLimit() {
  const messages = [
    { role: 'system', content: 'System prompt' },
    { role: 'user', content: 'Msg 1' },
    { role: 'assistant', content: 'Reply 1' },
    { role: 'user', content: 'Msg 2' },
    { role: 'assistant', content: 'Reply 2' },
    { role: 'user', content: 'Msg 3' }
  ];

  const trimmed = trimConversationHistory(messages, { maxMessages: 2 });

  // Should keep system message + last 2 conversation messages
  assert.strictEqual(trimmed.length, 3);
  assert.strictEqual(trimmed[0].role, 'system');
  assert.strictEqual(trimmed[1].content, 'Reply 2');
  assert.strictEqual(trimmed[2].content, 'Msg 3');

  console.log('✓ testTrimConversationHistoryMessageLimit passed');
}

function testTrimConversationHistoryTokenLimit() {
  const longText = 'a'.repeat(2000); // ~500 tokens
  const messages = [
    { role: 'system', content: 'System prompt' },
    { role: 'user', content: longText },
    { role: 'assistant', content: longText },
    { role: 'user', content: 'Short recent message' }
  ];

  // Restrict to ~300 tokens max
  const trimmed = trimConversationHistory(messages, { maxMessages: 10, maxTokens: 300 });

  // Long earlier messages should be dropped due to token limit, leaving system + recent short message
  assert(trimmed.length < messages.length);
  assert.strictEqual(trimmed[0].role, 'system');
  assert.strictEqual(trimmed[trimmed.length - 1].content, 'Short recent message');

  console.log('✓ testTrimConversationHistoryTokenLimit passed');
}

function testEdgeCases() {
  assert.deepStrictEqual(trimConversationHistory([]), []);
  assert.deepStrictEqual(trimConversationHistory(null), []);

  const single = [{ role: 'user', content: 'hi' }];
  assert.deepStrictEqual(trimConversationHistory(single), single);

  console.log('✓ testEdgeCases passed');
}

function runAll() {
  console.log('Running Memory Unit Tests...');
  testEstimateTokens();
  testTrimConversationHistoryMessageLimit();
  testTrimConversationHistoryTokenLimit();
  testEdgeCases();
  console.log('All Memory Unit Tests Passed Successfully!');
}

runAll();
