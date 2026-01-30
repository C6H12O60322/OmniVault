console.log("OmniVault: Scraper Ready!");

// Listen for the button click from popup.js


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    
// --- NEW SMART SCRAPER ---
    // 1. Find the main chat rows (ChatGPT uses these specific IDs now)
    let rows = document.querySelectorAll('[data-testid^="conversation-turn-"]');
    let chatData = [];
    rows.forEach((row, index) => {
      // 1. Try to find explicit labels (The "Nametag" Check)
      let isUser = row.querySelector('[data-testid="user-message"]');
      let isAI = row.querySelector('[data-testid="assistant-message"]');
      
      let role = "Unknown";

      if (isUser) {
        role = "User";
      } else if (isAI) {
        role = "ChatGPT";
      } else {
        // 2. Fallback: The "Odd/Even" Rule (The Change!)
        // If we can't find a nametag, we assume they take turns.
        // Even numbers (0, 2, 4) = User
        // Odd numbers (1, 3, 5) = ChatGPT
        role = (index % 2 === 0) ? "User" : "ChatGPT";
      }

      // Find the text content
      let textDiv = row.querySelector('.markdown') || row.querySelector('.text-message');
      
      if (textDiv) {
        chatData.push({
          role: role, 
          content: textDiv.innerText
        });
      }
    });
    /*v1 01/25/26
    rows.forEach(row => {
      // Check if this row belongs to the User
      //  let isUser = row.querySelector('[data-testid="user-message"]');
      // NEW CODE (Added)

    // Check 1: The standard ID (Same as before)
    let isUser = row.querySelector('[data-testid="user-message"]');

    // Check 2: Look for your profile picture (Added)
    // If Check 1 failed, look for an image tag that says "User"
    if (!isUser) {
    isUser = row.querySelector('img[alt="User"]');
    }

    // Check 3: The "Process of Elimination" (Added)
    // If we still aren't sure, look for the ChatGPT icon. 
    // If there is NO robot icon, then it MUST be the User.
    if (!isUser) {
        let hasGptIcon = row.querySelector('svg[data-testid="icon-openai"]');
        if (!hasGptIcon) isUser = true;
    }
      
      // Find the actual text content div
      let textDiv = row.querySelector('.markdown') || row.querySelector('.text-message');
      
      if (textDiv) {
        chatData.push({
          role: isUser ? "User" : "ChatGPT", 
          content: textDiv.innerText
        });
      }
    });

    // Fallback: If the smart way finds nothing (layout changed), use the old way
    if (chatData.length === 0) {
        console.log("Smart scraper failed, trying backup method...");
        let messages = document.querySelectorAll('.text-message, .markdown');
        messages.forEach((msg, index) => {
            chatData.push({
                role: index % 2 === 0 ? "User" : "ChatGPT", // Guess based on order
                content: msg.innerText
            });
        });
    }*/
    // --- END NEW CODE ---

    /*v1 01/25/26
    // 1. Find all chat messages (Selectors change, but this works for now)
    // We look for elements that usually contain the text
    let messages = document.querySelectorAll('.text-message, .markdown'); 
    let chatData = [];

    messages.forEach(msg => {
      chatData.push({
        role: "unknown", // We will improve role detection later
        content: msg.innerText
      });
    });

    console.log("Scraped Data:", chatData);
*/
    // 2. Send this data to your Python Server (The Waiter)

   /*etch('http://localhost:8000/process-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatData })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Server replied:", data);
      sendResponse({ status: "success" });
    })
    .catch(err => {
      console.error("Server Error:", err);
      sendResponse({ status: "error" });
    });*/
// ... inside your existing code ...

    // 2. Send this data to your Python Server
    fetch('http://localhost:8000/process-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatData })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Server replied:", data);
      
      // --- NEW CODE STARTS HERE ---
      // 3. Save the clean text to Chrome Storage
      // REPLACEMENT CODE
      chrome.storage.local.set({ 'pending_transfer': data.clean_text }, () => {
          console.log(`Data saved. Opening ${request.destination}...`);
          
          // Check the destination button the user actually clicked
          if (request.destination === "gemini") {
              chrome.runtime.sendMessage({ action: "open_gemini" });
          }
          
          if (request.destination === "claude") {
              chrome.runtime.sendMessage({ action: "open_claude" });
          }
          
          // (Optional) If you ever want to export GPT -> GPT
          if (request.destination === "chatgpt") {
              chrome.runtime.sendMessage({ action: "open_chatgpt" });
          }
      });
      // --- NEW CODE ENDS HERE ---

      sendResponse({ status: "success" });
    })
    .catch(err => {
      console.error("Server Error:", err);
      sendResponse({ status: "error" });
    });

// ...
    return true; // Keeps the message channel open for the async fetch
  }
});

// ... (Keep your existing Scraper logic at the top) ...

// --- PASTE LOGIC (New!) ---
console.log("OmniVault: ChatGPT Paster Loaded!");

window.addEventListener('load', () => {
  checkAndPasteGPT();
});

function checkAndPasteGPT() {
  chrome.storage.local.get(['pending_transfer'], (result) => {
    if (result.pending_transfer) {
      console.log("Found data for ChatGPT! Pasting...");
      pasteToChatGPT(result.pending_transfer).then((pasted) => {
        if (pasted) {
          chrome.storage.local.remove(['pending_transfer']);
        }
      });
    }
  });
}

function waitForElement(getElement, intervalMs = 500, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const element = typeof getElement === "function" ? getElement() : document.querySelector(getElement);
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

function handleMissingInputOnce() {
  const key = "omnivault_self_heal_input_reload";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "true");
    console.log("Input box missing for 10s. Reloading page once...");
    window.location.reload();
    return;
  }
  console.log("Input box still missing after a reload.");
}

async function pasteToChatGPT(text) {
  const inputField = await waitForElement('#prompt-textarea');
  if (!inputField) {
    handleMissingInputOnce();
    return false;
  }

  inputField.focus();
  document.execCommand('insertText', false, text);

  const sendButton = await waitForElement(() => {
    const button = document.querySelector('[data-testid="send-button"]');
    return button && !button.disabled ? button : null;
  });

  if (sendButton) {
    console.log("Clicking Send...");
    sendButton.click();
  } else {
    console.log("Could not find ChatGPT send button.");
  }

  return true;
}

// --- PDF DOWNLOAD LISTENER (Add to bottom of content_gpt.js) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_pdf") {
    console.log("PDF Download requested for ChatGPT...");

    // 1. RE-USE SCRAPER LOGIC
    // (We use the same logic as the transfer feature)
    let rows = document.querySelectorAll('[data-testid^="conversation-turn-"]');
    let chatData = [];

    rows.forEach((row, index) => {
      let isUser = row.querySelector('[data-testid="user-message"]');
      let isAI = row.querySelector('[data-testid="assistant-message"]');
      let role = isUser ? "User" : (isAI ? "ChatGPT" : (index % 2 === 0 ? "User" : "ChatGPT"));
      
      let textDiv = row.querySelector('.markdown') || row.querySelector('.text-message');
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
    .then(response => response.blob()) // <--- Important: Expect a binary file, not JSON
    .then(blob => {
      // 3. Create a fake link to trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'OmniVault_ChatGPT_Export.pdf'; // The filename you will see
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      console.log("PDF Downloaded!");
    })
    .catch(err => console.error("PDF Error:", err));
  }
});

// --- NEW: Instant Paste Listener (No Reload Needed) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "paste_trigger") {
        console.log("Hot Swap detected! Pasting immediately...");
        checkAndPasteGPT(); // Re-use your existing paste function
    }
});

// (Keep your existing window.addEventListener code too! 
// We need BOTH: one for new tabs, one for existing tabs.)
