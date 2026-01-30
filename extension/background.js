// background.js
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

// 2. NEW TRAFFIC CONTROLLER: Handles both Gemini AND ChatGPT
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

    // 2. If we "Hot Swapped" (didn't reload), trigger paste immediately
    chrome.tabs.sendMessage(activeTab.id, { action: "paste_trigger" })
      .catch(err => console.log("Tab wasn't ready for message, user might need to reload once manually."));
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
  
  // (Keep your existing PDF Proxy code below if you have it)
});

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
