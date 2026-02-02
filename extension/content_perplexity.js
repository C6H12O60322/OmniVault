console.log("OmniVault: Perplexity Script Loaded");

// --- SCRAPER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape" && request.source === "perplexity") {
    // Perplexity messages usually have distinct classes, but they change often.
    // We target the main prose containers.
    let rows = document.querySelectorAll('.prose'); 
    let chatData = [];

    rows.forEach((row, index) => {
        // Simple odd/even logic for roles if explicit labels are missing
        let role = index % 2 === 0 ? "User" : "Perplexity";
        chatData.push({ role: role, content: row.innerText });
    });

    // ... (Standard Send to Server Logic) ...
    // Remember to add the new open_perplexity/open_grok calls here!
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

        // Perplexity Selector: simple textarea
        waitForElement('textarea[placeholder*="Ask"], textarea', 10000)
            .then((inputField) => {
                inputField.focus();
                document.execCommand('insertText', false, result.pending_transfer);
                
                // Submit Button
                waitForElement('button[aria-label="Submit"], button[aria-label*="Send"]', 3000)
                    .then(btn => btn.click());
                    
                chrome.storage.local.remove(['pending_transfer']);
            });
    });
}
// ... (Include waitForElement helper) ...