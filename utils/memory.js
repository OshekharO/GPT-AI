/**
 * Utility module for conversation memory management.
 * Provides functions to estimate token usage and trim conversation history using a sliding window
 * while preserving critical system instructions and recent conversation turns.
 */

/**
 * Estimates the token count of a given text or message array.
 * Uses a heuristic of ~4 characters per token for English/code text.
 *
 * @param {string|object|Array} input
 * @returns {number} Estimated token count
 */
function estimateTokens(input) {
  if (!input) return 0;

  if (typeof input === 'string') {
    return Math.ceil(input.length / 4);
  }

  if (Array.isArray(input)) {
    return input.reduce((acc, item) => acc + estimateTokens(item), 0);
  }

  if (typeof input === 'object') {
    let text = '';
    if (typeof input.content === 'string') {
      text += input.content;
    } else if (Array.isArray(input.content)) {
      text += input.content.map(p => (typeof p === 'string' ? p : p.text || '')).join('');
    } else if (Array.isArray(input.parts)) {
      text += input.parts.map(p => (typeof p === 'string' ? p : p.text || '')).join('');
    }
    if (input.role) text += input.role;
    return Math.ceil((text.length + 10) / 4); // +10 overhead per message structure
  }

  return 0;
}

/**
 * Trims conversation messages array to keep context within specified message/token limits.
 * Retains system messages at the start and keeps the most recent turns.
 *
 * @param {Array<object>} messages Array of message objects (e.g. [{ role: 'user', content: '...' }])
 * @param {object} options
 * @param {number} [options.maxMessages=10] Max number of user/assistant conversation messages to keep
 * @param {number} [options.maxTokens=3000] Max estimated tokens allowed for conversation history
 * @returns {Array<object>} Trimming-adjusted messages array
 */
function trimConversationHistory(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const {
    maxMessages = 10,
    maxTokens = 3000
  } = options;

  // Separate system/instructions messages (always keep at start) from conversation turns
  const systemMessages = [];
  const conversationTurns = [];

  for (const msg of messages) {
    if (msg && (msg.role === 'system' || msg.role === 'developer')) {
      systemMessages.push(msg);
    } else {
      conversationTurns.push(msg);
    }
  }

  // Step 1: Limit conversation turns count using sliding window (keep latest)
  let trimmedTurns = conversationTurns.length > maxMessages
    ? conversationTurns.slice(-maxMessages)
    : [...conversationTurns];

  // Step 2: Ensure total estimated tokens do not exceed maxTokens
  let currentTokens = estimateTokens(systemMessages) + estimateTokens(trimmedTurns);

  while (trimmedTurns.length > 1 && currentTokens > maxTokens) {
    // Drop the oldest non-system message
    trimmedTurns.shift();
    currentTokens = estimateTokens(systemMessages) + estimateTokens(trimmedTurns);
  }

  return [...systemMessages, ...trimmedTurns];
}

module.exports = {
  estimateTokens,
  trimConversationHistory
};
