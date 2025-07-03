import { API_BASE_URL } from "../config/constants.js";
import { getToken } from "./utils.js";

export const handleUserRequest = async (request, sender, sendResponse) => {
  let keepAlive = setTimeout(() => {}, 1000); // Keeps service worker alive
  try {
    console.log("[user-service.js] handleUserRequest Function");
    const userData = await getUser();
    console.log("[user-service.js] Backgroundjs userData", userData);
    if (userData && userData.data && userData.data.user) {
      console.log("[user-service.js] Sending user data to content script", userData.data.user);
      sendResponse({
        success: true,
        user: userData.data.user,
      });
    } else {
      console.error("[user-service.js] User data not found in response", userData);
      sendResponse({
        success: false,
        error: "User data not found in response",
      });
    }
  } catch (error) {
    console.error("[user-service.js] Error handling user request:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  } finally {
    clearTimeout(keepAlive);
  }
  return true; // ✅ This is required for async sendResponse to work properly
};

export const getUser = async () => {
  console.log("******** getUser Function ********");

  // Get token using the correct key "token"
  const token = await getToken();

  console.log("token", token);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("response", response);

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid token using chrome.storage.local with correct key
      await new Promise((resolve, reject) => {
        chrome.storage.local.remove("token", () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError));
          } else {
            resolve();
          }
        });
      });
      throw new Error("Authentication token expired or invalid");
    }
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  console.log("returning response.json()");

  return await response.json();
};
