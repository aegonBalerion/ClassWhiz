import { handleDownload } from "./services/download-service.js";
import { handleUserRequest } from "./services/user-service.js";

// ✅ Debug: background script loaded
console.log("[background.js] ✅ Background script initialized");

// 🔄 Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[background.js] 📩 Received message:", request);

  const { action } = request;

  if (action === "download") {
    console.log("[background.js] 📁 Handling 'download'");
    handleDownload(request, sender, sendResponse);
    return true; // async
  }

  if (action === "getUser") {
    console.log("[background.js] 👤 Handling 'getUser'");
    handleUserRequest(request, sender, sendResponse);
    return true; // async
  }

  if (action === "uploadToServer") {
    console.log("🛠️ uploadToServer() called with data:", request);

    // ✅ Get token from chrome.storage.local
    chrome.storage.local.get("token", async (res) => {
      const token = res.token;
      if (!token) {
        console.error("❌ No token found");
        sendResponse({ success: false, error: "Token not found" });
        return;
      }

      try {
        // Defensive: ensure files is an array
        const files = Array.isArray(request.files) ? request.files : [];
        const payload = {
          title: request.title,
          course: request.course,
          files: files.map(f => ({
            name: f.name,
            url: f.url,
          })),
        };
        const response = await fetch("http://localhost:8000/api/lectures/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("❌ Upload failed:", data);
          sendResponse({ success: false, error: data.message || "Upload failed" });
        } else {
          console.log("✅ Uploaded to backend:", data);
          sendResponse({ success: true, data });
        }
      } catch (err) {
        console.error("🚨 Upload error:", err);
        sendResponse({ success: false, error: err.message || "Unknown error" });
      }
    });

    return true; // ✅ keep port open for async sendResponse
  }

  // 🚫 Unknown action
  console.warn("[background.js] ❌ Unknown action:", action);
  sendResponse({ success: false, error: "Unknown action" });
});
