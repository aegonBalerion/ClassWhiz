// // import AWS from "../config/aws.js";
// import AWS from "../config/s3Client.js";
// import fs from "fs/promises";
// import { ApiError } from "./ApiError.js";

// // Initialize S3 client
// const s3 = new AWS.S3();

// export const uploadToS3 = async (filePath, bucketName, objectKey) => {
//   try {
//     // Add validation
//     if (!bucketName) throw new Error("Bucket name is required");
//     if (!objectKey) throw new Error("Object key is required");
//     if (!filePath) throw new Error("File path is required");

//     // Check if file already exists
//     try {
//       await s3
//         .headObject({
//           Bucket: bucketName,
//           Key: objectKey,
//         })
//         .promise();

//       // If file exists, get the URL from AWS using getSignedUrl
//       const url = await s3.getSignedUrl("getObject", {
//         Bucket: bucketName,
//         Key: objectKey,
//         Expires: 3600, // URL expires in 1 hour
//       });

//       // Remove the signature part to get the public URL
//       const publicUrl = url.split("?")[0];
//       console.log(`File already exists. URL: ${publicUrl}`);
//       return publicUrl;
//     } catch (error) {
//       // File doesn't exist, proceed with upload
//       if (error.code === "NotFound") {
//         const fileContent = await fs.readFile(filePath);

//         const params = {
//           Bucket: bucketName,
//           Key: objectKey,
//           Body: fileContent,
//           ACL: "public-read",
//         };

//         const data = await s3.upload(params).promise();
//         console.log(`File uploaded successfully. URL: ${data.Location}`);
//         return data.Location;
//       }

//       // If error is not NotFound, throw it
//       throw error;
//     }
//   } catch (error) {
//     console.error("Error handling file:", error);
//     throw error;
//   }
// };

// export const downloadFromS3 = async (bucketName, objectKey, downloadPath) => {
//   try {
//     const params = {
//       Bucket: bucketName,
//       Key: objectKey,
//     };

//     const data = await s3.getObject(params).promise();
//     await fs.writeFile(downloadPath, data.Body);
//     console.log(`File downloaded successfully to ${downloadPath}`);
//   } catch (error) {
//     console.error("Error downloading file:", error);
//     throw error;
//   }
// };

// export const downloadFromURL = async (url, downloadPath) => {
//   try {
//     return new Promise((resolve, reject) => {
//       https
//         .get(url, (response) => {
//           // Check if response is successful
//           if (response.statusCode !== 200) {
//             reject(
//               new Error(`Failed to download file: ${response.statusCode}`)
//             );
//             return;
//           }

//           // Create write stream
//           const fileStream = fs.createWriteStream(downloadPath);

//           // Pipe the response to the file
//           response.pipe(fileStream);

//           // Handle stream events
//           fileStream.on("finish", () => {
//             fileStream.close();
//             console.log(`File downloaded successfully to ${downloadPath}`);
//             resolve();
//           });

//           fileStream.on("error", (err) => {
//             // Clean up the file if there was an error
//             fs.unlink(downloadPath).catch(console.error);
//             reject(err);
//           });
//         })
//         .on("error", (err) => {
//           reject(err);
//         });
//     });
//   } catch (error) {
//     console.error("Error downloading file:", error);
//     throw error;
//   }
// };

import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import https from "https";

dotenv.config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Upload file to S3
export const uploadToS3 = async (filePath, bucketName, objectKey) => {
  try {
    if (!bucketName || !objectKey || !filePath)
      throw new Error("Missing required parameters");

    // Read the file
    const fileContent = await fs.readFile(filePath);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ACL: "public-read",
    });

    await s3.send(uploadCommand);

    const fileURL = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;
    console.log(`✅ File uploaded to: ${fileURL}`);
    return fileURL;
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    throw error;
  }
};

// ✅ Check if file exists on S3 and get public URL
export const checkIfExistsOnS3 = async (bucketName, objectKey) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    await s3.send(command); // If not found, this throws an error
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;
    return publicUrl;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return null; // File not found
    }
    throw err;
  }
};

// ✅ Download from S3 (optional, if needed)
export const downloadFromS3 = async (bucketName, objectKey, downloadPath) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const { Body } = await s3.send(command);

    const writeStream = fssync.createWriteStream(downloadPath);
    Body.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log(`✅ File downloaded to: ${downloadPath}`);
        resolve();
      });
      writeStream.on("error", reject);
    });
  } catch (error) {
    console.error("❌ Error downloading from S3:", error);
    throw error;
  }
};

// ✅ Download file from external URL (e.g., Google Drive)
export const downloadFromURL = async (url, downloadPath) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download file. Status: ${res.statusCode}`));
        }

        const fileStream = fssync.createWriteStream(downloadPath);
        res.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          console.log(`✅ Downloaded file from URL to: ${downloadPath}`);
          resolve();
        });

        fileStream.on("error", (err) => {
          fssync.unlink(downloadPath, () => {});
          reject(err);
        });
      })
      .on("error", reject);
  });
};
