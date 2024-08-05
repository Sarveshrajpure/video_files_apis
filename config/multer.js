const multer = require("multer");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const maxFileSize = process.env.MAX_FILE_SIZE_IN_BYTES;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists
    if (!fs.existsSync(path.join(process.cwd(), "uploads"))) {
      fs.mkdirSync(path.join(process.cwd(), "uploads"));
    }
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

module.exports = upload;
