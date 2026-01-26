/*document.getElementById('transferBtn').addEventListener('click', async () => {
  // 1. Get the current active tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 2. Send a message to the script running inside ChatGPT
  chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
    if (response && response.status === "success") {
      alert("Success! Data sent to Python Brain.");
    } else {
      alert("Error: Are you on a ChatGPT page?");
    }
  });
});
*/
document.getElementById('transferBtn').addEventListener('click', async () => {
  // Get the current tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message with detailed error handling
  chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
    
    // Check if the connection failed entirely
    if (chrome.runtime.lastError) {
      alert("CONNECTION ERROR:\n" + chrome.runtime.lastError.message);
      return;
    }

    if (response && response.status === "success") {
      alert("Success! Data sent to Python Brain.");
    } else {
      alert("UNKNOWN ERROR: The script ran but didn't return success.");
    }
  });
});
