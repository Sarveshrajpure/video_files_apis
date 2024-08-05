const express = require("express");
const router = express.Router();
const videoController = require("../controllers/video.controller");
const auth = require("../middlewares/authMiddleware.js");
require("dotenv").config();
const upload = require("../config/multer.js");

router.post("/upload", auth(), upload.single("video"), videoController.uploadVideo);

router.patch("/trim", auth(), videoController.trimVideo);

router.put("/concat", auth(), videoController.concatenateVideos);

router.get("/videolink", auth(), videoController.getVideoLink);

module.exports = router;
