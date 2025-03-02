document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleButton");
  const messageElement = document.getElementById("message");
  const apiKeyInput = document.getElementById("apiKey");
  const saveApiKeyBtn = document.getElementById("saveApiKey");
  const apiKeyStatus = document.getElementById("apiKeyStatus");

  // Initialize button state
  function initializeButtonState() {
    chrome.storage.local.get(["isFloatingButtonActive"], function (result) {
      const isActive = result.isFloatingButtonActive !== false;
      updateToggleButton(isActive);
    });
  }

  // Update button appearance
  function updateToggleButton(isActive) {
    toggleButton.textContent = isActive
      ? "Deactivate Floating Button"
      : "Activate Floating Button";
    toggleButton.className = isActive ? "toggle-btn active" : "toggle-btn";
  }

  // Show temporary message
  function showMessage(text, duration = 2000) {
    messageElement.textContent = text;
    setTimeout(() => {
      messageElement.textContent = "";
    }, duration);
  }

  // Handle button click
  toggleButton.addEventListener("click", function () {
    chrome.storage.local.get(["isFloatingButtonActive"], function (result) {
      const newState = !(result.isFloatingButtonActive !== false);

      // Update storage
      chrome.storage.local.set(
        { isFloatingButtonActive: newState },
        function () {
          // Send message to content script
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "toggleFloatingButton",
                  isActive: newState,
                });
              }
            },
          );

          // Update UI
          updateToggleButton(newState);
          showMessage(
            newState
              ? "Floating button activated"
              : "Floating button deactivated",
          );
        },
      );
    });
  });

  // Load saved API key
  chrome.storage.local.get(["geminiApiKey"], function (result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      apiKeyStatus.textContent = "API Key is set";
      apiKeyStatus.style.color = "#4CAF50";
    }
  });

  // Save API key
  saveApiKeyBtn.addEventListener("click", function () {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, function () {
        apiKeyStatus.textContent = "API Key saved successfully!";
        apiKeyStatus.style.color = "#4CAF50";
        setTimeout(() => {
          apiKeyStatus.textContent = "API Key is set";
        }, 2000);
      });
    } else {
      apiKeyStatus.textContent = "Please enter a valid API key";
      apiKeyStatus.style.color = "#f44336";
    }
  });

  // Initialize on load
  initializeButtonState();
});
