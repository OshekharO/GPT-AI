## 2026-05-20 - Express Scraping Stream Cleanup & Validation Anti-Patterns

**Learning:** Express routes handling upstream streaming HTTP requests (e.g. `responseType: 'stream'`) must listen to `req.on('close')` and destroy upstream response streams to prevent worker thread leaks and unnecessary API bandwidth usage when clients disconnect. Additionally, when processing text SSE lines in buffer chunks, re-splitting the entire buffer on `\n` on every `data` chunk results in O(N^2) memory allocations; using line-by-line index scanning with buffer slicing guarantees O(N) stream consumption performance.

**Action:** Always attach `req.on('close')` handlers to destroy active upstream stream handles, guard response dispatching with `if (res.headersSent) return`, and use index-based newline slicing (`lineBuffer.indexOf('\n')`) for streaming SSE response parsers.
