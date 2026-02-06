document.getElementById("transferBtn").addEventListener("click", () => {
    const source = document.getElementById("sourceModel").value;
    const dest = document.getElementById("destModel").value;

    console.log(`Plan: Transfer from ${source} to ${dest}`);

    // Safety Check: Don't transfer to the same place
    if (source === dest) {
        alert("Please choose a different Destination than the Source!");
        return;
    }

    // 1. Identify the Source Tab
    let queryUrl = "";
    if (source === "chatgpt") queryUrl = "https://chatgpt.com/*";
    if (source === "gemini") queryUrl = "https://gemini.google.com/*";
    if (source === "claude") queryUrl = "https://claude.ai/*"; 
    if (source === "perplexity") queryUrl = "https://www.perplexity.ai/*"; //02/01/26
    if (source === "grok") queryUrl = "https://grok.com/*";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Tell the content script to scrape the current page.
        chrome.tabs.sendMessage(tabs[0].id, { 
            action: "scrape",
            source: source,
            destination: dest 
        });
    });
});

document.getElementById("pdfBtn").addEventListener("click", () => {
    // Current simple PDF logic (assumes you are on the source tab)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "download_pdf" });
    });
});



/* v2 01/26/26 
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
*/
