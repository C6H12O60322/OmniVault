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

/*
// Run as soon as the page loads
window.addEventListener('load', () => {
  // Check if there is data waiting for us
  chrome.storage.local.get(['pending_transfer'], (result) => {
    if (result.pending_transfer) {
      console.log("Found data to paste!");
      pasteToGemini(result.pending_transfer);
      
      // Clear storage so we don't paste it again next time you refresh
      chrome.storage.local.remove(['pending_transfer']);
    }
  });
});

function pasteToGemini(text) {
  // Gemini uses a Rich Text Editor, so we need a specific selector
  // Note: This selector (.ql-editor) is common, but might change.
  // We try a few common strategies.
  
  const checkForInput = setInterval(() => {
    // Strategy A: Look for the specific content editable div
    const inputField = document.querySelector('div[contenteditable="true"]') || 
                       document.querySelector('.ql-editor');

    if (inputField) {
      clearInterval(checkForInput); // Stop looking
      
      // Focus the field
      inputField.focus();
      
      // Paste the text
      // For rich text editors, 'execCommand' is often the most reliable way 
      // to simulate a real user paste
      document.execCommand('insertText', false, text);
      
      console.log("Pasted successfully!");
    } else {
      console.log("Waiting for Gemini input box...");
    }
  }, 1000); // Check every second
}
  */