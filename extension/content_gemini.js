console.log("OmniVault: Gemini Content Script Loaded (Scraper & Paster)");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // --- SCENARIO A: SCRAPE GEMINI (New!) ---
  if (request.action === "scrape" && request.source === "gemini") {
    
    // 1. Find Gemini Chat Rows
    // Gemini uses specific attributes like 'message-content' or 'model-response-text'
    // Note: Google changes classes often, so we use broad selectors
    let rows = document.querySelectorAll('user-query, model-response'); 
    let chatData = [];

    rows.forEach((row, index) => {
        let role = "Unknown";
        if (row.tagName === "USER-QUERY") role = "User";
        if (row.tagName === "MODEL-RESPONSE") role = "Gemini";

        // Find text content
        let textDiv = row.querySelector('.message-content') || row;
        
        if (textDiv) {
            chatData.push({
                role: role,
                content: textDiv.innerText
            });
        }
    });

    console.log("Gemini Scraped:", chatData);

    // 2. Send to Server
    fetch('http://localhost:8000/process-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatData })
    })
    .then(res => res.json())
    .then(data => {
        // 3. Save & Redirect to ChatGPT
        
        chrome.storage.local.set({ 'pending_transfer': data.clean_text }, () => {
    
    if (request.destination === "chatgpt") {
        chrome.runtime.sendMessage({ action: "open_chatgpt" });
    }
    
    if (request.destination === "claude") {
        chrome.runtime.sendMessage({ action: "open_claude" });
    }
    
    if (request.destination === "gemini") {
        chrome.runtime.sendMessage({ action: "open_gemini" });
    }
});
        sendResponse({ status: "success" });
    });

    return true;
  }
});

// ... YOUR EXISTING PASTE LOGIC IS BELOW HERE ...
// (Do not delete the window.addEventListener('load') part!)
console.log("OmniVault: Gemini Paster Loaded!");

// Since we force-reload the page in background.js, this runs every time now!
window.addEventListener('load', () => {
  // Give the page a moment to fully initialize
  setTimeout(checkAndPaste, 1500);
});

function checkAndPaste() {
  chrome.storage.local.get(['pending_transfer'], (result) => {
    if (result.pending_transfer) {
      console.log("Found data! Pasting and Sending...");
      pasteAndSend(result.pending_transfer);
      
      // Clear storage
      chrome.storage.local.remove(['pending_transfer']);
    }
  });
}

function pasteAndSend(text) {
  const checkForInput = setInterval(() => {
    // 1. Find the Input Box
    const inputField = document.querySelector('div[contenteditable="true"]') || 
                       document.querySelector('.ql-editor');

    if (inputField) {
      clearInterval(checkForInput);
      
      // A. Focus and Paste
      inputField.focus();
      document.execCommand('insertText', false, text);
      
      // B. Wait for the "Send" button to unlock, then click it
      setTimeout(() => {
        // Selector for Gemini's Send Button (Look for aria-label or the specific icon class)
        // Note: This selector looks for the button that sends the message
        const sendButton = document.querySelector('button[aria-label*="Send"]') || 
                           document.querySelector('button[aria-label*="傳送"]') || // Traditional Chinese
                           document.querySelector('.send-button'); // Fallback

        if (sendButton) {
            console.log("Clicking Send...");
            sendButton.click();
        } else {
            console.log("Could not find send button, you might need to press Enter manually.");
        }
      }, 500); // Wait 0.5s after pasting
      
    }
  }, 1000);
}


/*v2 01/26/26
console.log("OmniVault: Gemini Paster Loaded!");


// --- TRIGGER 1: Run on Page Load (For New Tabs) ---
window.addEventListener('load', () => {
  checkAndPaste();
});

// --- TRIGGER 2: Run on Message (For Existing Tabs) ---
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "paste_trigger") {
    console.log("Wake up call received! Pasting now...");
    checkAndPaste();
  }
});

// --- The Shared Logic ---
function checkAndPaste() {
  chrome.storage.local.get(['pending_transfer'], (result) => {
    if (result.pending_transfer) {
      console.log("Found data to paste:", result.pending_transfer);
      pasteToGemini(result.pending_transfer);
      
      // Clean up
      chrome.storage.local.remove(['pending_transfer']);
    }
  });
}

function pasteToGemini(text) {
  const checkForInput = setInterval(() => {
    // Try to find the input box
    const inputField = document.querySelector('div[contenteditable="true"]') || 
                       document.querySelector('.ql-editor');

    if (inputField) {
      clearInterval(checkForInput);
      inputField.focus();
      document.execCommand('insertText', false, text);
    }
  }, 500); 
  
  // Stop trying after 10 seconds to save memory
  setTimeout(() => clearInterval(checkForInput), 10000);
}
*/

// --- PDF DOWNLOAD LISTENER (Add to bottom of content_gemini.js) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_pdf") {
    console.log("PDF Download requested for Gemini...");

    // 1. RE-USE GEMINI SCRAPER LOGIC
    let rows = document.querySelectorAll('user-query, model-response'); 
    let chatData = [];

    rows.forEach((row) => {
        let role = "Unknown";
        if (row.tagName === "USER-QUERY") role = "User";
        if (row.tagName === "MODEL-RESPONSE") role = "Gemini";

        let textDiv = row.querySelector('.message-content') || row;
        if (textDiv) {
            chatData.push({ role: role, content: textDiv.innerText });
        }
    });

    // 2. SEND TO SERVER & DOWNLOAD FILE
    fetch('http://localhost:8000/download-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatData })
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'OmniVault_Gemini_Export.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      console.log("PDF Downloaded!");
    })
    .catch(err => console.error("PDF Error:", err));
  }
});

// --- 01/30/26: Instant Paste Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "paste_trigger") {
        console.log("Hot Swap detected! Pasting immediately...");
        checkAndPaste(); // Re-use your existing Gemini paste function
    }
});