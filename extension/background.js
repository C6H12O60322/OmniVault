// background.js

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

// ... existing code ...

// Listen for messages from the content script
/*v1 01/25/26
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "open_gemini") {
    console.log("Opening Gemini tab...");
    chrome.tabs.create({ url: "https://gemini.google.com/app" });
  }
});*/
// background.js

// ... (Keep your onInstalled listener at the top) ...

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "open_gemini") {
    console.log("Request to open Gemini received.");

    // 1. Check if a Gemini tab is ALREADY open
    const tabs = await chrome.tabs.query({ url: "https://gemini.google.com/*" });

    if (tabs.length > 0) {
      // --- SCENARIO: Tab Exists ---
      const existingTab = tabs[0];
      
      // A. Bring it to front
      await chrome.tabs.update(existingTab.id, { active: true });
      
      // B. Send a "Poke" message to force the paste
      // We wait a tiny bit to ensure the focus is complete
      setTimeout(() => {
        chrome.tabs.sendMessage(existingTab.id, { action: "paste_trigger" });
      }, 500);
      
    } else {
      // --- SCENARIO: No Tab ---
      // Open a new one (The window.onload in content script will handle pasting)
      chrome.tabs.create({ url: "https://gemini.google.com/app" });
    }
  }
});