chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeSelection",
    title: "Analyze selection with LegalEase AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeSelection") {
    const selectedText = info.selectionText;
    
    // Store the text in local storage so the popup can access it
    chrome.storage.local.set({ lastSelectedText: selectedText }, () => {
      // Open the popup or notify the user
      // Since we can't programmatically open the popup, we can use a notification or just tell the user to open it
      chrome.action.openPopup(); 
    });
  }
});
