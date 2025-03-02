// Initialize extension state
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ isFloatingButtonActive: true });
    console.log("Content Extractor extension installed. Floating button is active.");
});

// Handle messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getState') {
        chrome.storage.local.get(['isFloatingButtonActive'], function(result) {
            sendResponse({ isFloatingButtonActive: result.isFloatingButtonActive !== false });
        });
        return true;
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith("chrome://")) {
        chrome.storage.local.get(['isFloatingButtonActive'], function(result) {
            if (result.isFloatingButtonActive !== false) {
                chrome.tabs.sendMessage(tabId, {
                    action: 'toggleFloatingButton',
                    isActive: true
                }).catch(() => {
                    // Ignore errors when content script isn't ready
                });
            }
        });
    }
});