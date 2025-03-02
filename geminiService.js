// geminiService.js
class GeminiService {
  constructor() {
    this.API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    this.API_KEY = null;
    this.conversationHistory = [];
  }

  async getApiKey() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(["geminiApiKey"], function (result) {
        if (result.geminiApiKey) {
          resolve(result.geminiApiKey);
        } else {
          reject(
            new Error(
              "API key not found. Please set your API key in the extension popup.",
            ),
          );
        }
      });
    });
  }

  async makeRequest(prompt, useHistory = false) {
    try {
      const apiKey = await this.getApiKey();
      
      let contents = [];
      
      if (useHistory && this.conversationHistory.length > 0) {
        contents = [...this.conversationHistory];
        contents.push({
          role: "user",
          parts: [{ text: prompt }]
        });
      } else {
        contents = [{
          role: "user",
          parts: [{ text: prompt }]
        }];
      }
      
      const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Update conversation history
      if (useHistory) {
        this.conversationHistory.push({
          role: "user",
          parts: [{ text: prompt }]
        });
        
        this.conversationHistory.push({
          role: "model",
          parts: [{ text: responseText }]
        });
        
        // Keep history to a reasonable size (last 10 messages)
        if (this.conversationHistory.length > 10) {
          this.conversationHistory = this.conversationHistory.slice(-10);
        }
      }
      
      return responseText;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  async generateSummary(text) {
    // Reset conversation history when starting a new summary
    this.conversationHistory = [];
    
    const prompt = `Please provide a comprehensive summary of the following text, highlighting the main points and key insights. Format with clear paragraphs and bullet points where appropriate:

${text}`;
    
    try {
      const response = await this.makeRequest(prompt);
      
      // Initialize conversation history with the context
      this.conversationHistory = [
        {
          role: "user",
          parts: [{ text: `Context: ${text}\n\nPlease summarize this text.` }]
        },
        {
          role: "model",
          parts: [{ text: response }]
        }
      ];
      
      return response;
    } catch (error) {
      throw new Error("Failed to generate summary: " + error.message);
    }
  }

  async generateResponse(question, context) {
    const prompt = question;
    
    try {
      return await this.makeRequest(prompt, true);
    } catch (error) {
      throw new Error("Failed to generate response: " + error.message);
    }
  }
  
  clearConversation() {
    this.conversationHistory = [];
  }
}

const geminiService = new GeminiService();
window.geminiService = geminiService;
