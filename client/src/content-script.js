console.log("✅ Content script loaded");

import {
  createButton,
  createStatusDiv,
  updateStatus,
} from "./scripts/ui-utils.js";
import {
  getFileId,
  getDownloadLink,
  getDriveLinks,
} from "./scripts/drive-utils.js";
import { getUser } from "./scripts/user-utils.js";

const init = async () => {
  if (document.getElementById("my-extension-root")) return;

  const root = document.createElement("div");
  root.id = "my-extension-root";
  root.style.position = "fixed";
  root.style.top = "10px";
  root.style.right = "10px";
  root.style.zIndex = "9999";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "8px";
  document.body.appendChild(root);

  const user = await getUser();
  getUser().then((user) => {
  console.log("🎉 Final User Received in content-script", user);
});


  if (user) {
    const userInfoDiv = document.createElement("div");
    userInfoDiv.innerText = `👤 Logged in as ${user.name} (${user.batch})`;
    userInfoDiv.style.color = "white";
    userInfoDiv.style.padding = "8px 12px";
    userInfoDiv.style.background = "#4caf50";
    userInfoDiv.style.borderRadius = "8px";
    userInfoDiv.style.fontSize = "14px";
    userInfoDiv.style.fontWeight = "500";
    userInfoDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    userInfoDiv.style.maxWidth = "300px";
    userInfoDiv.style.wordWrap = "break-word";
    root.appendChild(userInfoDiv);
  }

  if (user) {
    const statusDiv = createStatusDiv();
    const button = createButton();

    button.addEventListener("click", async () => {
      const courseElement = document.querySelector(
        ".tNGpbb.YrFhrf-ZoZQ1.YVvGBb"
      );

      if (!courseElement) {
        updateStatus(statusDiv, "⚠️ Unable to detect course title.");
        return;
      }

      const course = courseElement.innerText;
      console.log("📚 Course:", course);

      const anchorTags = getDriveLinks();
      updateStatus(statusDiv, `🔍 Found ${anchorTags.length} files to process`);
      console.log(anchorTags);

      for (let i = 0; i < anchorTags.length; i++) {
        const { href, text } = anchorTags[i];
        const fileId = getFileId(href);

        console.log("📁 href:", href);
        console.log("📝 text:", text);
        console.log("🔑 fileId:", fileId);

        if (fileId) {
          updateStatus(
            statusDiv,
            `📥 Processing file ${i + 1} of ${anchorTags.length}: ${text}`
          );
          const downloadUrl = getDownloadLink(fileId);
          console.log("🔗 downloadUrl", downloadUrl);

          try {

            await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage(
                {
                  action: "download",
                  url: downloadUrl,
                  name: text,
                },
                async (response) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else if (!response?.success) {
                    reject(new Error(response?.error || "Unknown download error"));
                  } else {
                    try {
                      chrome.runtime.sendMessage(
                        {
                          action: "uploadToServer",
                          title: text,
                          course: course,
                          files: [
                            {
                              name: text,
                              url: downloadUrl,
                            },
                          ],
                        },
                        (uploadRes) => {
                          if (chrome.runtime.lastError || !uploadRes?.success) {
                            console.error(
                              "🚫 Upload failed:",
                              uploadRes?.error || chrome.runtime.lastError
                            );
                          } else {
                            console.log("✅ Uploaded to backend:", uploadRes);
                          }
                        }
                      );
                      resolve();
                    } catch (uploadErr) {
                      reject(uploadErr);
                    }
                  }
                }
              );
            });

            updateStatus(
              statusDiv,
              `✅ Successfully processed ${i + 1} of ${anchorTags.length} files`
            );
          } catch (error) {
            updateStatus(
              statusDiv,
              `❌ Error processing file ${i + 1}: ${error.message}`
            );
            console.log("💥 Error during download or upload:", error);
          }
        }
      }

      updateStatus(statusDiv, "🎉 All files processed");
      setTimeout(() => {
        statusDiv.style.display = "none";
      }, 3000);
    });

    root.appendChild(statusDiv);
    root.appendChild(button);
  } else {
    const statusDiv = createStatusDiv();
    updateStatus(statusDiv, "⚠️ Please log in first.");
    root.appendChild(statusDiv);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
