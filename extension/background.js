// background.js

// 1. KEEP THIS: It helps the extension work immediately after installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log("OmniVault Installed! Injecting scripts into open tabs...");

  const tabs = await chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://gemini.google.com/*", "https://claude.ai/*"]
  });

  for (const tab of tabs) {
    try {
      console.log(`Extension ready for tab ${tab.id}`);
    } catch (err) {
      console.warn(`Could not inject into tab ${tab.id}:`, err);
    }
  }
});

// 2. THE MASTER CONTROLLER (Handles Traffic & Data Proxy)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // --- A. TRAFFIC CONTROLLER (Tab Switching Logic) ---
  
  // Helper function to handle the "Hot Swap" logic
  async function handleTransfer(targetUrl, targetOrigin, forceReload = false) {
    // 1. Check if tab exists
    const tabs = await chrome.tabs.query({ url: targetUrl });
    let activeTab = null;

    if (tabs.length > 0) {
      activeTab = tabs[0];

      if (forceReload) {
        // Force a fresh page (new chat) to avoid stale input state.
        await chrome.tabs.update(activeTab.id, { active: true, url: targetOrigin });
        console.log(`Reloaded tab for fresh chat: ${activeTab.id}`);
        return;
      }

      // FAST PATH: Tab exists. Just switch to it. DO NOT RELOAD.
      await chrome.tabs.update(activeTab.id, { active: true });
      console.log(`Switched to existing tab: ${activeTab.id}`);
    } else {
      // SLOW PATH: No tab. Must create new one.
      activeTab = await chrome.tabs.create({ url: targetOrigin });
      console.log(`Created new tab: ${activeTab.id}`);
      return; 
    }

    // 2. If we "Hot Swapped" (didn't reload), we must manually trigger the paste
    setTimeout(() => {
        chrome.tabs.sendMessage(activeTab.id, { action: "paste_trigger" })
        .catch(err => console.log("Tab wasn't ready for message, user might need to reload once manually."));
    }, 500);
  }

  // --- ROUTING COMMANDS ---
  if (request.action === "open_chatgpt") {
    handleTransfer("https://chatgpt.com/*", "https://chatgpt.com/", true);
  }

  if (request.action === "open_gemini") {
    handleTransfer("https://gemini.google.com/*", "https://gemini.google.com/app", true);
  }

  if (request.action === "open_claude") {
    handleTransfer("https://claude.ai/*", "https://claude.ai/new", true);
  }

  if (request.action === "open_perplexity") {
    handleTransfer("https://www.perplexity.ai/*", "https://www.perplexity.ai/", true);
  }

  if (request.action === "open_grok") {
    handleTransfer("https://grok.com/*", "https://grok.com/", true);
  }



  // --- B. MASTER PROXY (Server Talking Logic) ---
  // This allows Perplexity/Grok/Claude to talk to Localhost by asking Background to do it.

  // 1. PROXY: Process Chat History (Send to Python -> Save to Storage)
  if (request.action === "proxy_process_history") {
      console.log("Background: Proxying chat history for", request.source);
      
      fetch('http://localhost:8000/process-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: request.messages })
      })
      .then(res => res.json())
      .then(data => {
          // Save to storage so the next tab can read it
          chrome.storage.local.set({ 'pending_transfer': data.clean_text }, () => {
              // Open the destination tab
              if (request.destination === "chatgpt") handleTransfer("https://chatgpt.com/*", "https://chatgpt.com/", true);
              if (request.destination === "gemini") handleTransfer("https://gemini.google.com/*", "https://gemini.google.com/app", true);
              if (request.destination === "claude") handleTransfer("https://claude.ai/*", "https://claude.ai/new", true);
              if (request.destination === "perplexity") handleTransfer("https://www.perplexity.ai/*", "https://www.perplexity.ai/", true);
              if (request.destination === "grok") handleTransfer("https://grok.com/*", "https://grok.com/", true);
          });
          sendResponse({ status: "success" });
      })
      .catch(err => console.error("Proxy Server Error:", err));
      
      return true; // Keep channel open for async response
  }

  // 2. PROXY: Download PDF
  if (request.action === "proxy_download_pdf") {
      console.log("Background: Proxying PDF download...");
      
      fetch('http://localhost:8000/download-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: request.messages })
      })
      .then(response => response.blob())
      .then(blob => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = function() {
              chrome.downloads.download({
                  url: reader.result,
                  filename: request.filename,
                  saveAs: false
              });
          };
      })
      .catch(err => console.error("Proxy PDF Error:", err));
      
      return true; // Keep channel open
  }
});


/*

// background.js 02/01/26
// 1. KEEP THIS: It helps the extension work immediately after installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log("OmniVault Installed! Injecting scripts into open tabs...");

  const tabs = await chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://gemini.google.com/*"]
  });

  for (const tab of tabs) {
    try {
      // We inject both scripts just to be safe, or logic to decide which one
      // based on the URL. For simplicity, we just log it here.
      // (The manifest.json usually handles the main injection, this is a backup)
      console.log(`Extension reloaded for tab ${tab.id}`);
    } catch (err) {
      console.warn(`Could not inject into tab ${tab.id}:`, err);
    }
  }
});

// 2. 01/30/26 TRAFFIC CONTROLLER: Handles both Gemini AND ChatGPT
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {

  // Helper function to handle the "Hot Swap" logic
  async function handleTransfer(targetUrl, targetOrigin) {
    // 1. Check if tab exists
    const tabs = await chrome.tabs.query({ url: targetUrl });
    let activeTab = null;

    if (tabs.length > 0) {
      // FAST PATH: Tab exists. Just switch to it. DO NOT RELOAD.
      activeTab = tabs[0];
      await chrome.tabs.update(activeTab.id, { active: true });
      console.log(`Switched to existing tab: ${activeTab.id}`);
    } else {
      // SLOW PATH: No tab. Must create new one.
      activeTab = await chrome.tabs.create({ url: targetOrigin });
      console.log(`Created new tab: ${activeTab.id}`);
      // If new, we must wait for it to load. The content script's 'window.onload' handles this.
      return; 
    }

    // 2. If we "Hot Swapped" (didn't reload), we must manually trigger the paste
    // We wait a tiny bit (500ms) to ensure the tab switch happened visually
    setTimeout(() => {
        chrome.tabs.sendMessage(activeTab.id, { action: "paste_trigger" })
        .catch(err => console.log("Tab wasn't ready for message, user might need to reload once manually."));
    }, 500);
  }

  // --- ROUTING ---
  if (request.action === "open_chatgpt") {
    handleTransfer("https://chatgpt.com/*", "https://chatgpt.com/");
  }

  if (request.action === "open_gemini") {
    handleTransfer("https://gemini.google.com/*", "https://gemini.google.com/app");
  }

  if (request.action === "open_claude") {
    handleTransfer("https://claude.ai/*", "https://claude.ai/new");
  }
  // --- SCENARIO 4: Open PERPLEXITY ---
  if (request.action === "open_perplexity") {
    handleTransfer("https://www.perplexity.ai/*", "https://www.perplexity.ai/");
  }

  // --- SCENARIO 5: Open GROK ---
  if (request.action === "open_grok") {
    // We prioritize the standalone app
    handleTransfer("https://grok.com/*", "https://grok.com/");
  }
  // (Keep your existing PDF Proxy code below if you have it)
});

*/
/*
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  
  // --- SCENARIO 1: Open GEMINI ---
  if (request.action === "open_gemini") {
    const tabs = await chrome.tabs.query({ url: "https://gemini.google.com/*" });
    if (tabs.length > 0) {
      // Tab exists: Reload it to clear chat, then switch to it
      await chrome.tabs.update(tabs[0].id, { active: true, url: "https://gemini.google.com/app" });
    } else {
      // No tab: Create new one
      chrome.tabs.create({ url: "https://gemini.google.com/app" });
    }
  }

  // --- SCENARIO 2: Open CHATGPT (New!) ---
  if (request.action === "open_chatgpt") {
    const tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });
    if (tabs.length > 0) {
      // Tab exists: Reload it to get a fresh chat
      await chrome.tabs.update(tabs[0].id, { active: true, url: "https://chatgpt.com/" });
    } else {
      // No tab: Create new one
      chrome.tabs.create({ url: "https://chatgpt.com/" });
    }
  }

});
// This runs ONLY when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log("OmniVault Installed! Injecting scripts into open tabs...");

  // 1. Find all open tabs that look like ChatGPT
  const tabs = await chrome.tabs.query({
    url: ["https://chatgpt.com/*"]
  });

  // 2. Force-inject the content script into them
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content_gpt.js"]
      });
      console.log(`Injected script into tab ${tab.id}`);
    } catch (err) {
      console.warn(`Could not inject into tab ${tab.id}:`, err);
    }
  }
});



chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "open_gemini") {
    
    // Check if Gemini is open
    const tabs = await chrome.tabs.query({ url: "https://gemini.google.com/*" });

    if (tabs.length > 0) {
      // SCENARIO: Tab Exists -> Force it to go to "New Chat" URL
      const existingTab = tabs[0];
      
      // We update the URL to the base app URL, which clears the current chat
      await chrome.tabs.update(existingTab.id, { 
        active: true, 
        url: "https://gemini.google.com/app" 
      });
      
      // No need to send a "poke" message anymore, because reloading the page
      // will trigger window.addEventListener('load') in content_gemini.js automatically!
      
    } else {
      // SCENARIO: No Tab -> Open new one
      chrome.tabs.create({ url: "https://gemini.google.com/app" });
    }
  }
});
*/
