console.log("OmniVault: Claude Script Loaded");

// --- 1. SCRAPER (Read from Claude) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape" && request.source === "claude") {
    
    // Claude uses specific classes for messages
    // Note: These classes (.font-user-message) might change, but work for now.
    // If they fail, we fall back to the generic "User" vs "AI" icon detection.
    let rows = document.querySelectorAll('.font-user-message, .font-claude-message'); 
    
    // Fallback: If specific classes aren't found, try generic message containers
    if (rows.length === 0) {
        rows = document.querySelectorAll('[data-test-render-count]'); 
    }

    let chatData = [];

    rows.forEach((row) => {
        let role = "Unknown";
        
        // Check Class Names
        if (row.classList.contains('font-user-message')) role = "User";
        if (row.classList.contains('font-claude-message')) role = "Claude";
        
        // Fallback checks (Icon/Text)
        if (role === "Unknown") {
             if (row.innerText.includes("Claude")) role = "Claude";
             else role = "User";
        }

        chatData.push({
            role: role,
            content: row.innerText
        });
    });

    console.log("Claude Scraped:", chatData);

    // Send to Server
    fetch('http://localhost:8000/process-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatData })
    })
    .then(res => res.json())
    .then(data => {
        chrome.storage.local.set({ 'pending_transfer': data.clean_text }, () => {
            // Check Destination
            if (request.destination === "chatgpt") chrome.runtime.sendMessage({ action: "open_chatgpt" });
            if (request.destination === "gemini") chrome.runtime.sendMessage({ action: "open_gemini" });
            if (request.destination === "claude") chrome.runtime.sendMessage({ action: "open_claude" });
        });
        sendResponse({ status: "success" });
    });
    return true;
  }
  
  // --- PDF DOWNLOAD ---
  if (request.action === "download_pdf") {
      // Re-use scraper logic above, but fetch('http://localhost:8000/download-pdf' ...
      // (You can copy the logic from content_gemini.js and just change selectors)
      console.log("PDF download triggered for Claude");
  }
});

// --- 2. PASTER (Write to Claude) ---
window.addEventListener('load', () => {
  setTimeout(checkAndPasteClaude, 2000);
});

function checkAndPasteClaude() {
  chrome.storage.local.get(['pending_transfer'], (result) => {
    if (result.pending_transfer) {
      console.log("Found data for Claude! Pasting...");
      pasteToClaude(result.pending_transfer);
      chrome.storage.local.remove(['pending_transfer']);
    }
  });
}

function pasteToClaude(text) {
  // 1. Find Input Field (Claude uses a contenteditable div)
  const inputField = document.querySelector('div[contenteditable="true"]');

  if (inputField) {
    inputField.focus();
    document.execCommand('insertText', false, text);

    // 2. Click Send (Wait for button to activate)
    setTimeout(() => {
      // Claude's button usually has aria-label="Send Message"
      const sendButton = document.querySelector('button[aria-label="Send Message"]') || 
                         document.querySelector('button[aria-label*="Send"]'); 
      
      if (sendButton) {
        sendButton.click();
      } else {
        console.log("Could not find Claude send button");
      }
    }, 500);
  }
}