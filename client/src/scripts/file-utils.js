

export const downloadFile = async (url, filename, course) => {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "download",
      url,
      filename,
      course,
    });

    if (!response.success) {
      throw new Error(response.error || "Download failed");
    }

    return true;
  } catch (error) {
    console.error(`Error downloading ${filename}:`, error);
    throw error;
  }
};



export const sendToServer = async (url, filename, course) => {
  try {
    // Step 1: Fetch the file as a blob
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from ${url}`);
    }

    const blob = await fileResponse.blob();

    // Step 2: Create form data
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("filename", filename);
    formData.append("course", course);

    // Step 3: Send to your backend API
    const response = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ File uploaded successfully:", result);

    return result;
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error);
    throw error;
  }
};










