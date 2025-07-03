// import { Router } from "express";

// import { postLecture, getLectures } from "../controllers/lectureControllers.js";
// import { validateToken } from "../middleware/validateToken.js";
// import { upload } from "../middleware/multer.js";

// const router = Router();

// router.post("/", validateToken, upload.single("file"), postLecture);
// router.post("/getLectures", validateToken, getLectures);

// export default router;



import { Router } from "express";
import {
  postLecture,
  getLectures,
  createLecture, // ✅ new controller
  getLecturesForUser,
} from "../controllers/lectureControllers.js";
import { validateToken } from "../middleware/validateToken.js";
import { upload } from "../middleware/multer.js";

const router = Router();

// 🧾 Old multer-based upload (keep this if your dashboard uses it)
router.post("/", validateToken, upload.single("file"), postLecture);

// ✅ New JSON-based upload for Chrome extension
router.post("/sync", validateToken, createLecture);

// 🔍 Get lectures for logged-in user
router.post("/getLectures", validateToken, getLectures);

router.get("/user", validateToken, getLecturesForUser);


export default router;
