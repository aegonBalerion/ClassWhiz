export const getUser = async () => {
  console.log("[user-utils.js] getUser function called");
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getUser" }, (response) => {
      console.log("[user-utils.js] sendMessage response:", response);
      if (!response) {
        console.error("[user-utils.js] No response from background script");
        resolve(null);
        return;
      }
      if (!response.success) {
        console.error("[user-utils.js] Failed to get user response successful nahi hua", response.error);
        resolve(null);
        return;
      }
      console.log("[user-utils.js] response.user:", response.user);
      resolve(response.user);
    });
  });
};
