const express = require("express");
const router = express.Router();
const videoController = require("../controllers/video.controller");
const auth = require("../middlewares/authMiddleware.js");

router.post("/upload", auth(), videoController.uploadVideo);

module.exports = router;
