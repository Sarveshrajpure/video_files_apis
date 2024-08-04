const express = require("express");
const router = express.Router();
const videoController = require("../controllers/video.controller");
const auth = require("../middlewares/authMiddleware.js");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const maxFileSize = process.env.MAX_FILE_SIZE_IN_BYTES;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(maxFileSize) },
});

router.post("/upload", auth(), upload.single("video"), videoController.uploadVideo);

module.exports = router;
