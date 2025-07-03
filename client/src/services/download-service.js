export const handleDownload = (request, sender, sendResponse) => {
  const { url, name } = request;

  try {
    chrome.downloads.download(
      {
        url,
        filename: name,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download error:", chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log("Download started, id:", downloadId);
          sendResponse({ success: true });
        }
      }
    );
  } catch (error) {
    console.error("Download exception:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true; // Keeps the message channel open for async sendResponse
};




export const uploadToServer = async (request, sender, sendResponse) => {
  try {
    const { fileName, course, fileBlob } = request;

    const token = await new Promise((resolve) =>
      chrome.storage.local.get("token", (result) => {
        resolve(result.token);
      })
    );

    if (!token) {
      return sendResponse({ success: false, error: "No auth token found" });
    }

    const formData = new FormData();
    const file = new File([fileBlob], fileName); // create File from Blob
    formData.append("file", file);
    formData.append("name", fileName);
    formData.append("course", course);
    formData.append("batch", "2026"); // You can make dynamic later
    formData.append("branch", "CSAI");

    const response = await fetch("http://localhost:8000/api/lectures", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // ✅ No Content-Type header manually for FormData
      },
      body: formData,
    });

    const data = await response.json();
    console.log("📡 Response from /lectures:", data);
    sendResponse({ success: true, data });
  } catch (error) {
    console.error("💥 Error uploading to server:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
};
