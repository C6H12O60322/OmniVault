console.log("OmniVault: Grok Script Loaded");

// --- SCRAPER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape" && request.source === "grok") {
    console.log("OmniVault: Grok scrape triggered");
    // Grok message containers
    let rows = document.querySelectorAll('[data-testid="message-content"], [data-testid="message"], [data-testid="chat-message"], .message-row, article'); 
    if (!rows || rows.length === 0) {
      rows = document.querySelectorAll('[role="article"], [data-message-id], [data-message-author]');
    }
    let chatData = [];

    rows.forEach((row, index) => {
        let role = "Unknown";
        // Check for specific Grok indicators or infer from layout
        if (row.innerHTML && row.innerHTML.includes("grok-icon")) role = "Grok";

        // If the row has an explicit author label, prefer it
        const author = row.getAttribute && row.getAttribute("data-message-author");
        if (author === "assistant") role = "Grok";
        if (author === "user") role = "User";

        if (role === "Unknown") {
          role = index % 2 === 0 ? "User" : "Grok";
        }

        const text = row.innerText ? row.innerText.trim() : "";
        if (text) {
          chatData.push({ role: role, content: text });
        }
    });

    if (chatData.length === 0) {
      // Last-resort fallback: look for any visible text blocks
      const blocks = document.querySelectorAll('div[dir="auto"], div[data-testid*="message"]');
      blocks.forEach((block, index) => {
        const text = block.innerText ? block.innerText.trim() : "";
        if (text) {
          const role = index % 2 === 0 ? "User" : "Grok";
          chatData.push({ role, content: text });
        }
      });
    }

    console.log("OmniVault: Grok rows", rows.length, "messages", chatData.length);
    chrome.runtime.sendMessage({
      action: "proxy_process_history",
      source: "grok",
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

        // Grok Selector: textarea
        waitForElement('textarea, div[contenteditable="true"]', 10000)
            .then((inputField) => {
                if (!inputField) return;
                inputField.focus();
                document.execCommand('insertText', false, result.pending_transfer);
                
                // Grok's Send button often has an arrow icon
                waitForElement('button[aria-label="Send"], button[aria-label="Submit"], button[type="submit"]', 3000)
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
    console.log("Refreshing Grok before paste...");
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
