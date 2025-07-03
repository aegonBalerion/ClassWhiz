// // Function to create or update data in chrome.storage.local
// export function setItem(key, value) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.set({ [key]: value }, () => {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError);
//       } else {
//         resolve();
//       }
//     });
//   });
// }

// // Function to read data from chrome.storage.local
// export function getItem(key) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.get([key], (result) => {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError);
//       } else {
//         resolve(result[key] || null);
//       }
//     });
//   });
// }

// // Function to remove data from chrome.storage.local
// export function removeItem(key) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.remove(key, () => {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError);
//       } else {
//         resolve();
//       }
//     });
//   });
// }



// storage.js

// Detect if chrome.storage.local is available
const isChromeStorageAvailable =
  typeof chrome !== "undefined" &&
  chrome.storage &&
  chrome.storage.local;

// Function to create or update data
export function setItem(key, value) {
  return new Promise((resolve, reject) => {
    if (isChromeStorageAvailable) {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  });
}

// Function to read data
export function getItem(key) {
  return new Promise((resolve, reject) => {
    if (isChromeStorageAvailable) {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key] ?? null);
        }
      });
    } else {
      try {
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : null);
      } catch (error) {
        reject(error);
      }
    }
  });
}

// Function to remove data
export function removeItem(key) {
  return new Promise((resolve, reject) => {
    if (isChromeStorageAvailable) {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } else {
      try {
        localStorage.removeItem(key);
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  });
}
