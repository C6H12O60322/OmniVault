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
      chrome.storage.local.set({ 'pending_transfer': data.clean_text }, () => {
        console.log("Data saved to storage. Opening Gemini...");
        
        // 4. Tell background.js to open Gemini
        chrome.runtime.sendMessage({ action: "open_gemini" });
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