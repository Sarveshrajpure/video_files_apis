const httpStatus = require("http-status");
const video = require("../db/models/video");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;



ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../config/s3Config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const { pipeline } = require("stream");
const { promisify, isArray } = require("util");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");
const pipe = promisify(pipeline);

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

    await s3.send(command);
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

    const fileUrl = await getSignedUrl(s3, getFileCommand, {
      expiresIn: 3600,
    });

    return fileUrl;
  } catch (err) {
    throw err;
  }
};

const findVideoById = async (id) => {
  try {
    let findVideo = await video.findByPk(id, { raw: true });

    return findVideo;
  } catch (err) {
    throw err;
  }
};

const downloadFile = async (bucketName, key) => {
  try {
    let params = {
      Bucket: bucketName,
      Key: key,
    };

    const getFileCommand = new GetObjectCommand(params);

    const fileData = await s3.send(getFileCommand);

    const filePath = path.join(process.cwd(), "downloads", key);

    // Ensure the downloads directory exists
    if (!fs.existsSync(path.join(process.cwd(), "downloads"))) {
      fs.mkdirSync(path.join(process.cwd(), "downloads"));
    }

    await pipe(fileData.Body, fs.createWriteStream(filePath));

    return filePath;
  } catch (err) {
    throw err;
  }
};

const trimVideo = (inputPath, outputPath, startTime, trimDuration) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(trimDuration)
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
};

const updateVideo = async (id, videoId, name, transaction) => {
  try {
    let updatedVideo = await video.update(
      { name, videoId },
      { where: { id: id } },
      { transaction }
    );

    return updatedVideo;
  } catch (err) {
    throw err;
  }
};

const deleteVideoFromS3 = async (bucketName, key) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    const command = new DeleteObjectCommand(params);

    await s3.send(command);
  } catch (err) {
    throw err;
  }
};

const mergeVideos = (videoPaths) => {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = ffmpeg();

    videoPaths.forEach((videoPath) => {
      ffmpegCommand.input(videoPath);
    });
    const outputPath = path.join(process.cwd(), "concats", `${Date.now()}.mp4`);
    const tempPath = path.join(process.cwd(), "temp");
    console.log(outputPath);

    // Ensure the concats directory exists
    if (!fs.existsSync(path.join(process.cwd(), "concats"))) {
      fs.mkdirSync(path.join(process.cwd(), "concats"));
    }
    ffmpegCommand
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(new Error(`Error concatenating videos: ${err.message}`)))
      .mergeToFile(outputPath, tempPath);
  });
};

const getVideoResolution = async (filePath) => {
  try {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const videoStream = metadata.streams.find((stream) => stream.codec_type === "video");
        if (videoStream) {
          // const resolution = {
          //   width: videoStream.width,
          //   height: videoStream.height,
          // };
          const res = `${videoStream.width}x${videoStream.height}`;
          resolve(res);
        } else {
          reject(new Error("No video stream found"));
        }
      });
    });
  } catch (err) {
    throw err;
  }
};

const checkVideoResolution = async (videoIds) => {
  try {
    let videosData = await Promise.all(
      videoIds.map(async (id) => {
        try {
          let findVideo = await video.findOne({
            where: { videoId: id },
            attributes: ["videoId", "videoResolution"],
          });

          if (findVideo === null) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Video with videoId ${id} does not exist`);
          }
          return findVideo;
        } catch (err) {
          throw err;
        }
      })
    );

    let left = 0;
    let right = videosData.length - 1;

    while (left < right) {
      if (videosData[left]["videoResolution"] !== videosData[right]["videoResolution"]) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot merge - Video Resolutions do not match");
      }
      left++;
      right--;
    }

    return videosData;
  } catch (err) {
    throw err;
  }
};
module.exports = {
  getVideoDuration,
  uploadVideo,
  getFilesUrlFromS3,
  downloadFile,
  findVideoById,
  trimVideo,
  updateVideo,
  deleteVideoFromS3,
  mergeVideos,
  getVideoResolution,
  checkVideoResolution,
};
