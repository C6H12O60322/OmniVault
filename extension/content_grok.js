console.log("OmniVault: Grok Script Loaded");

// --- SCRAPER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape" && request.source === "grok") {
    // Grok message containers
    let rows = document.querySelectorAll('[data-testid="message-content"], .message-row'); 
    let chatData = [];

    rows.forEach((row) => {
        let role = "Unknown";
        // Check for specific Grok indicators or infer from layout
        if (row.innerHTML.includes("grok-icon")) role = "Grok";
        else role = "User";
        
        chatData.push({ role: role, content: row.innerText });
    });

    // ... (Standard Send to Server Logic) ...
    return true;
  }
});

// --- PASTER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "paste_trigger") initiateSmartPaste();
});

function initiateSmartPaste() {
    chrome.storage.local.get(['pending_transfer'], (result) => {
        if (!result.pending_transfer) return;

        // Grok Selector: textarea
        waitForElement('textarea', 10000)
            .then((inputField) => {
                inputField.focus();
                document.execCommand('insertText', false, result.pending_transfer);
                
                // Grok's Send button often has an arrow icon
                waitForElement('button[aria-label="Send"], button[aria-label="Submit"]', 3000)
                    .then(btn => btn.click());

                chrome.storage.local.remove(['pending_transfer']);
            });
    });
}
// ... (Include waitForElement helper) ...