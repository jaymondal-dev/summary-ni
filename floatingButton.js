// floatingButton.js
let isFloatingButtonActive = true;

// Function to extract content from the page
function extractPageContent() {
  function getVisibleText(element) {
    if (!element) return "";

    // Skip hidden elements
    const style = window.getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return "";
    }

    // Check element tag
    let text = "";
    if (element.tagName) {
      const tag = element.tagName.toLowerCase();

      // Get text from headings and paragraphs
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        text += element.textContent.trim() + "\n\n";
      } else if (tag === "p") {
        text += element.textContent.trim() + "\n\n";
      } else if (tag === "li") {
        text += "• " + element.textContent.trim() + "\n";
      } else if (tag === "blockquote") {
        text += "> " + element.textContent.trim() + "\n\n";
      } else if (tag === "div" && element.textContent.trim().length > 0) {
        // Only get text from divs that seem to contain content
        if (
          element.children.length === 0 ||
          (element.children.length === 1 &&
            element.children[0].tagName.toLowerCase() === "br")
        ) {
          text += element.textContent.trim() + "\n\n";
        }
      }
    }

    // Process child nodes
    for (const child of element.children) {
      text += getVisibleText(child);
    }

    return text;
  }

  try {
    // Try to find the main content area
    const mainContentSelectors = [
      "article",
      '[role="main"]',
      "main",
      ".main-content",
      ".post-content",
      ".article-content",
      ".entry-content",
      "#content",
      ".content",
    ];

    let mainContent = null;
    for (const selector of mainContentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element;
        break;
      }
    }

    // Fall back to body if no main content found
    mainContent = mainContent || document.body;

    // Extract text
    let extractedText = getVisibleText(mainContent);

    // Clean up the text
    return extractedText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  } catch (error) {
    console.error("Error extracting content:", error);
    return "Error extracting content. Please try again.";
  }
}

// Create floating button
function createFloatingButton() {
  const button = document.createElement("button");
  button.id = "content-extractor-float";

  const icon = document.createElement("img");
  icon.src = chrome.runtime.getURL("assets/icon.png");
  button.appendChild(icon);

  button.title = "Extract and Summarize Content";
  document.body.appendChild(button);

  // Create the modal and overlay
  const modal = createModal();
  const overlay = createOverlay();

  button.onclick = function () {
    try {
      const extractedContent = extractPageContent();
      const textArea = document.getElementById("content-extractor-text");
      if (textArea) {
        textArea.value = extractedContent;
        updateWordCount(extractedContent);
        modal.style.display = "flex";
        overlay.style.display = "block";

        // Focus on the textarea
        setTimeout(() => {
          textArea.focus();
          textArea.selectionStart = 0;
          textArea.selectionEnd = 0;
        }, 100);
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error extracting content");
    }
  };
}

// Create modal window
function createModal() {
  const modal = document.createElement("div");
  modal.id = "content-extractor-modal";
  modal.innerHTML = `
        <div id="content-extractor-modal-header">
            <h2 id="content-extractor-modal-title">AI Content Assistant</h2>
            <button id="content-extractor-close">×</button>
        </div>

        <div class="tab-navigation">
            <button class="tab-btn active" data-tab="text">Extracted Text</button>
            <button class="tab-btn" data-tab="chat">AI Chat</button>
        </div>

        <div id="text-tab" class="tab-content active">
            <textarea id="content-extractor-text" placeholder="The extracted content will appear here..."></textarea>
            <div class="text-controls">
                <div class="text-buttons">
                    <button id="copy-btn" class="action-btn secondary-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                        </svg>
                        Copy
                    </button>
                    <button id="download-btn" class="action-btn secondary-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                                                </svg>
                                                Download
                                            </button>
                                            <button id="generate-summary" class="action-btn primary-btn">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.11 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM19 19H5V5H19V19ZM7 10H9V12H7V10ZM7 7H9V9H7V7ZM7 13H17V15H7V13ZM11 10H17V12H11V10ZM11 7H17V9H11V7Z" fill="currentColor"/>
                                                </svg>
                                                Generate Summary
                                            </button>
                                        </div>
                                        <div id="word-count">Word count: 0</div>
                                    </div>
                                </div>

                                <div id="chat-tab" class="tab-content">
                                    <div id="chat-container">
                                        <div id="chat-messages">
                                            <div class="chat-message assistant">
                                                <div class="message-sender">Assistant</div>
                                                <div class="message-content">Hello! I can help you understand this content. Click "Generate Summary" to create a summary, or ask me any questions about the text.</div>
                                            </div>
                                        </div>
                                        <div id="chat-input-container">
                                            <button id="clear-chat">Clear chat</button>
                                            <textarea id="chat-input" placeholder="Ask a question about this content..."></textarea>
                                            <button id="send-message">Send</button>
                                        </div>
                                    </div>
                                </div>
                            `;
  document.body.appendChild(modal);

  // Set up event listeners
  setupModalEventListeners(modal);

  return modal;
}

// Create overlay
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "content-extractor-overlay";
  overlay.onclick = closeModal;
  document.body.appendChild(overlay);
  return overlay;
}

// Close modal
function closeModal() {
  const modal = document.getElementById("content-extractor-modal");
  const overlay = document.getElementById("content-extractor-overlay");
  if (modal) modal.style.display = "none";
  if (overlay) overlay.style.display = "none";
}

// Copy content
function copyContent() {
  const content = document.getElementById("content-extractor-text").value;
  navigator.clipboard
    .writeText(content)
    .then(() => showToast("Content copied to clipboard!"))
    .catch(() => showToast("Failed to copy content"));
}

// Download content
function downloadContent() {
  const content = document.getElementById("content-extractor-text").value;
  if (!content.trim()) {
    showToast("No content to download");
    return;
  }

  const pageTitle = document.title || "extracted-content";
  const sanitizedTitle = pageTitle
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .substring(0, 50);
  const filename = `${sanitizedTitle}.txt`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Content downloaded!");
}

// Show toast notification
function showToast(message) {
  const existingToast = document.querySelector(".content-extractor-toast");
  if (existingToast) {
    document.body.removeChild(existingToast);
  }

  const toast = document.createElement("div");
  toast.className = "content-extractor-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// Update word count
function updateWordCount(text) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wordCountElement = document.getElementById("word-count");
  if (wordCountElement) {
    wordCountElement.textContent = `Word count: ${wordCount}`;
  }
}

// Set up event listeners for modal
function setupModalEventListeners(modal) {
  document
    .getElementById("content-extractor-close")
    .addEventListener("click", closeModal);
  document.getElementById("copy-btn").addEventListener("click", copyContent);
  document
    .getElementById("download-btn")
    .addEventListener("click", downloadContent);

  // Tab switching
  const tabButtons = modal.querySelectorAll(".tab-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  // Chat functionality
  const generateSummaryBtn = document.getElementById("generate-summary");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-message");
  const clearChatBtn = document.getElementById("clear-chat");

  generateSummaryBtn.addEventListener("click", async () => {
    const content = document.getElementById("content-extractor-text").value;
    if (!content.trim()) {
      showToast("No content to summarize");
      return;
    }

    try {
      showLoading("Generating summary...");

      // Clear previous messages except the intro
      clearChat(true);

      const summary = await window.geminiService.generateSummary(content);
      addChatMessage("Assistant", summary);
      switchTab("chat"); // Switch to chat tab to show the summary
      hideLoading();
    } catch (error) {
      console.error("Summary generation error:", error);
      hideLoading();
      showToast(error.message || "Error generating summary");
    }
  });

  sendButton.addEventListener("click", async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    const content = document.getElementById("content-extractor-text").value;
    addChatMessage("You", question);
    chatInput.value = "";

    try {
      showLoading("Generating response...");
      const response = await window.geminiService.generateResponse(
        question,
        content,
      );
      addChatMessage("Assistant", response);
      hideLoading();
    } catch (error) {
      console.error("Response generation error:", error);
      hideLoading();
      showToast(error.message || "Error generating response");
    }
  });

  clearChatBtn.addEventListener("click", () => {
    clearChat();
  });

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
}

// Switch between tabs
function switchTab(tabName) {
  const tabs = document.querySelectorAll(".tab-content");
  const buttons = document.querySelectorAll(".tab-btn");

  tabs.forEach((tab) => tab.classList.remove("active"));
  buttons.forEach((btn) => btn.classList.remove("active"));

  document.getElementById(`${tabName}-tab`).classList.add("active");
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
}

// Add message to chat
function addChatMessage(sender, message) {
  const chatMessages = document.getElementById("chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = `chat-message ${sender.toLowerCase()}`;

  // Format the message with proper HTML
  let formattedMessage = message;

  // Convert markdown-style formatting
  // Bold
  formattedMessage = formattedMessage.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>",
  );
  // Italic
  formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Convert line breaks to paragraphs
  formattedMessage = formattedMessage
    .split("\n\n")
    .map((para) => {
      if (para.trim()) {
        return `<p>${para.trim()}</p>`;
      }
      return "";
    })
    .join("");
  // Handle single line breaks
  formattedMessage = formattedMessage.replace(/<\/p>\n<p>/g, "</p><p>");
  // Handle bullet points
  formattedMessage = formattedMessage.replace(
    /<p>- (.*?)<\/p>/g,
    "<p>• $1</p>",
  );

  messageElement.innerHTML = `
                                <div class="message-sender">${sender}</div>
                                <div class="message-content">${formattedMessage}</div>
                            `;

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Clear chat messages
function clearChat(leaveIntro = false) {
  const chatMessages = document.getElementById("chat-messages");
  if (leaveIntro) {
    // Remove all messages except the first one
    while (chatMessages.children.length > 1) {
      chatMessages.removeChild(chatMessages.lastChild);
    }
  } else {
    // Reset to just the intro message
    chatMessages.innerHTML = `
                                    <div class="chat-message assistant">
                                        <div class="message-sender">Assistant</div>
                                        <div class="message-content">Hello! I can help you understand this content. Click "Generate Summary" to create a summary, or ask me any questions about the text.</div>
                                    </div>
                                `;
  }

  // Reset the Gemini service conversation
  window.geminiService.clearConversation();
}

// Show loading indicator
function showLoading(message) {
  const loading = document.createElement("div");
  loading.id = "loading-indicator";
  loading.innerHTML = `
                                <div class="spinner"></div>
                                <div class="loading-message">${message}</div>
                            `;
  document.body.appendChild(loading);
}

// Hide loading indicator
function hideLoading() {
  const loading = document.getElementById("loading-indicator");
  if (loading) loading.remove();
}

// Initialize
function initialize() {
  chrome.storage.local.get(["isFloatingButtonActive"], function (result) {
    isFloatingButtonActive = result.isFloatingButtonActive !== false;
    if (isFloatingButtonActive) {
      createFloatingButton();
    }
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleFloatingButton") {
    isFloatingButtonActive = request.isActive;
    const floatingButton = document.getElementById("content-extractor-float");
    const modal = document.getElementById("content-extractor-modal");
    const overlay = document.getElementById("content-extractor-overlay");

    if (isFloatingButtonActive && !floatingButton) {
      createFloatingButton();
    } else if (!isFloatingButtonActive) {
      if (floatingButton) floatingButton.remove();
      if (modal) modal.remove();
      if (overlay) overlay.remove();
    }
  }
});

// Initialize when the script loads
initialize();
