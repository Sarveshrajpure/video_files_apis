const httpStatus = require("http-status");
const video = require("../db/models/video");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/s3Config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");

const getVideoDuration = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, function (err, metadata) {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration);
      }
    });
  });
};

const uploadVideo = async (bucketName, key, filePath, contentType) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    };
    const command = new PutObjectCommand(params);

    await s3Client.send(command);
  } catch (err) {
    throw err;
  }
};

const getFilesUrlFromS3 = async (bucketName, fileName) => {
  try {
    let getFilesParams = {
      Bucket: bucketName,
      Key: fileName,
    };

    const getFileCommand = new GetObjectCommand(getFilesParams);

    const fileUrl = await getSignedUrl(s3Client, getFileCommand, {
      expiresIn: 3600,
    });

    return fileUrl;
  } catch (err) {
    throw err;
  }
};

module.exports = { getVideoDuration, uploadVideo, getFilesUrlFromS3 };
