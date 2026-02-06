console.log("OmniVault: Perplexity Script Loaded");

// --- SCRAPER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape" && request.source === "perplexity") {
    console.log("OmniVault: Perplexity scrape triggered");
    // Perplexity messages change often; try stable attributes first.
    let rows = document.querySelectorAll('[data-testid="question"], [data-testid="answer"], [data-testid="message"]');

    // Fallback: broad prose containers if data-testid isn't available.
    if (!rows || rows.length === 0) {
      rows = document.querySelectorAll('.prose');
    }

    let chatData = [];

    rows.forEach((row, index) => {
        let role = "Unknown";

        const testId = row.getAttribute && row.getAttribute("data-testid");
        if (testId === "question") role = "User";
        if (testId === "answer" || testId === "message") role = "Perplexity";

        // Fallback: odd/even if no clear label
        if (role === "Unknown") {
          role = index % 2 === 0 ? "User" : "Perplexity";
        }

        const text = row.innerText ? row.innerText.trim() : "";
        if (text) {
          chatData.push({ role: role, content: text });
        }
    });

    console.log("OmniVault: Perplexity rows", rows.length, "messages", chatData.length);
    chrome.runtime.sendMessage({
      action: "proxy_process_history",
      source: "perplexity",
      destination: request.destination,
      messages: chatData
    }, (response) => {
      sendResponse(response || { status: "success" });
    });

    return true;
  }
});

// --- PASTER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "paste_trigger") initiateSmartPaste();
});

window.addEventListener('load', () => {
  initiateSmartPaste();
});

function initiateSmartPaste() {
    chrome.storage.local.get(['pending_transfer'], (result) => {
        if (!result.pending_transfer) return;

        if (shouldRefreshBeforePaste()) return;

        // Perplexity Selector: simple textarea
        waitForElement('textarea[placeholder*="Ask"], textarea', 10000)
            .then((inputField) => {
                if (!inputField) return;
                inputField.focus();
                document.execCommand('insertText', false, result.pending_transfer);
                
                // Submit Button
                waitForElement('button[aria-label="Submit"], button[aria-label*="Send"], button[type="submit"]', 3000)
                    .then(btn => {
                      if (btn) btn.click();
                    });
                    
                chrome.storage.local.remove(['pending_transfer']);
            });
    });
}

function shouldRefreshBeforePaste() {
  const key = "omnivault_refresh_before_paste";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "true");
    console.log("Refreshing Perplexity before paste...");
    window.location.reload();
    return true;
  }
  return false;
}

function waitForElement(selector, timeoutMs = 10000, intervalMs = 250) {
  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(timer);
        resolve(element);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, intervalMs);
  });
}
