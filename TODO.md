# TODO

## Performance Optimization (Latency)

Status: Done  
Priority: High

Problem: Short chat transfers (e.g., ~14 lines) take ~1 minute because the extension forces a hard reload of the destination tab and waits for the SPA to re-initialize.

### Completed (Smart Waiter)
- [x] Hot-swap: switch to existing tab and send `paste_trigger` immediately (no force reload).
- [x] Robust waits: replace fixed timers with `waitForElement` (poll every 500ms up to 10s).
- [x] Instant paste: listen for `paste_trigger` in all content scripts.
- [ ] Self-healing: if the input box is missing after 10s, auto-reload once.

### Remaining Ideas
- [ ] Replace `document.execCommand('insertText')` with `navigator.clipboard.writeText()` for faster input.

## Rich Content Support (Links & Graphs)

Status: Open  
Priority: Medium

Problem: Current scraper uses `.innerText`, which ignores hidden HTML elements and drops links/graphs.

### Solutions
- [ ] In all `extension/content_*.js` files, extract `<a href>` anchors and format them as Markdown links `[text](url)`.
- [ ] For graph widgets, scrape alt text or underlying data tables so LLMs can rebuild charts from raw data.

## Smart UX (Auto-Detect Source)

Status: Open  
Priority: Medium

Problem: Users must manually select the "Export From" model even when the active site is known.

### Solutions
- [ ] In `extension/popup.js`, read the active tab URL on init.
- [ ] Auto-set the source dropdown:
  - `chatgpt.com` → ChatGPT
  - `gemini.google.com` → Gemini
  - `claude.ai` → Claude

## Bug Fix: Fix PDF Download for Claude (CSP Error)

Status: Open  
Priority: High

Context: Claude.ai has a strict Content Security Policy (CSP) that blocks the content script from connecting to `localhost:8000`.

### The Plan (Proxy Strategy)
Route the download request through the Background Script, which is immune to CSP restrictions.

### To-Do List
- [ ] 1) Update `manifest.json`
  - Add `downloads` to the `permissions` list.
  - Reason: Required to use `chrome.downloads.download()`.
- [ ] 2) Update `extension/background.js` (The Proxy)
  - Add a new listener for `download_pdf_proxy`.
  - Logic: Receive message -> Fetch from Server -> Convert to Blob -> Trigger Chrome Download.
- [ ] 3) Update `extension/content_claude.js` (The Sender)
  - Remove the old `fetch()` code in the download section.
  - Replace with `chrome.runtime.sendMessage({ action: "download_pdf_proxy", ... })`.
- [ ] 4) Verify & Test
  - Reload Extension (crucial for manifest updates).
  - Refresh Claude.ai page.
  - Click "Download PDF" and confirm file saves without console errors.
