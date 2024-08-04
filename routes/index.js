const express = require("express");
const router = express.Router();
const userRoutes = require("./user.routes");
const videoRoutes = require("./video.routes");

router.use("/user", userRoutes);

router.use("/video", videoRoutes);

module.exports = router;
