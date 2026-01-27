# TODO

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
