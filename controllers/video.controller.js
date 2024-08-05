const httpStatus = require("http-status");
const video = require("../db/models/video");
const {
  uploadVideoSchema,
  trimVideoSchema,
  concatenateVideoSchema,
  getVideoLinkSchema,
} = require("../validations/videoValidation");
const { promisify } = require("util");
const fs = require("fs");
const unlinkAsync = promisify(fs.unlink);
const services = require("../services/index");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");
const sequelize = require("../config/database");
const path = require("path");

const videoController = {
  async uploadVideo(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const file = req.file;

      let values = await uploadVideoSchema.validateAsync({
        name: req.body.name,
        file: file,
      });

      const userId = req.authenticated.id;
      const bucket_name = process.env.BUCKET_NAME;

      let videoDuration = await services.videoService.getVideoDuration(values.file.path);
      let videoResolution = await services.videoService.getVideoResolution(values.file.path);

      if (videoDuration > process.env.MAX_VIDEO_DURATION) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Video Duration should be less then 25sec");
      } else if (videoDuration < process.env.MIN_VIDEO_DURATION) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Video Duration should be atleast 2sec");
      }

      await services.videoService.uploadVideo(
        bucket_name,
        values.file.filename,
        values.file.path,
        values.file.mimetype
      );

      //  Adding record in video model
      let videoCreated = await video.create(
        {
          name: values.name,
          videoId: values.file.filename,
          userId: userId,
          videoResolution: videoResolution,
        },
        { transaction: t }
      );

      let fileUrl = await services.videoService.getFilesUrlFromS3(
        bucket_name,
        values.file.filename
      );

      let response = videoCreated.toJSON();
      response.url = fileUrl;
      await t.commit();

      res.status(httpStatus.OK).send(response);

      await unlinkAsync(file.path);
    } catch (err) {
      await t.rollback();

      if (err.name === "ValidationError") {
        err.statusCode = httpStatus.BAD_REQUEST;
      }

      if (req.file) {
        await unlinkAsync(req.file.path);
      }

      next(err);
    }
  },
  async trimVideo(req, res, next) {
    const t = await sequelize.transaction();
    try {
      let values = await trimVideoSchema.validateAsync(req.body);

      let uploadedVideo = await services.videoService.findVideoById(values.id);

      if (!uploadedVideo) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Video not found!");
      }
      const key = uploadedVideo.videoId;
      const bucketName = process.env.BUCKET_NAME;

      // Downloading file to process

      await services.videoService.downloadFile(bucketName, key);

      // Trim video
      const inputPath = path.join(process.cwd(), "downloads", key);
      const outputPath = path.join(process.cwd(), "uploads", `trimmed_${key}`);

      await services.videoService.trimVideo(
        inputPath,
        outputPath,
        values.trimFrom,
        values.trimDuration
      );

      // upload new video to s3
      const newFileName = Date.now() + path.extname(outputPath);

      const fileContentType = `video/${key.split(".")[1]}`;

      await services.videoService.uploadVideo(bucketName, newFileName, outputPath, fileContentType);

      // Update video record
      await services.videoService.updateVideo(uploadedVideo.id, newFileName, uploadedVideo.name, t);

      await t.commit();

      let getNewFileUrl = await services.videoService.getFilesUrlFromS3(bucketName, newFileName);

      res.status(httpStatus.OK).send({
        message: "video trim successfull!",
        url: getNewFileUrl,
      });

      // await services.videoService.deleteVideoFromS3(bucketName, uploadedVideo.videoId);

      await unlinkAsync(outputPath);
      await unlinkAsync(inputPath);
    } catch (err) {
      await t.rollback();
      if (err.name === "ValidationError") {
        err.statusCode = httpStatus.BAD_REQUEST;
      }

      next(err);
    }
  },
  async concatenateVideos(req, res, next) {
    const t = await sequelize.transaction();
    let downloadPaths = [];
    let concatenatedVideoPath = "";
    try {
      let values = await concatenateVideoSchema.validateAsync(req.body);

      const userId = req.authenticated.id;
      const bucketName = process.env.BUCKET_NAME;

      // check videos and thier resolutions
      let videoIds = await services.videoService.checkVideoResolution(values.videoIds);

      // Download videos from  s3
      downloadPaths = await Promise.all(
        videoIds.map(async (item) => {
          let downloadPath = await services.videoService.downloadFile(bucketName, item.videoId);
          return downloadPath;
        })
      );

      // Concatenate Videos
      let concatenatedVideoPath = await services.videoService.mergeVideos(downloadPaths);

      // upload concatenated video
      const newFileName = path.basename(concatenatedVideoPath);
      const fileContentType = `video/${newFileName.split(".")[1]}`;
      await services.videoService.uploadVideo(
        bucketName,
        newFileName,
        concatenatedVideoPath,
        fileContentType
      );

      //  Adding record in video model
      let videoCreated = await video.create(
        {
          name: values.nameForConcatVideo,
          videoId: newFileName,
          userId: userId,
          videoResolution: videoIds[0].videoResolution,
        },
        { transaction: t }
      );

      let fileUrl = await services.videoService.getFilesUrlFromS3(bucketName, newFileName);

      let response = videoCreated.toJSON();
      response.url = fileUrl;

      await t.commit();

      res.status(httpStatus.OK).send(response);

      await unlinkAsync(concatenatedVideoPath);

      downloadPaths.forEach(async (paths) => {
        await unlinkAsync(paths);
      });
    } catch (err) {
      await t.rollback();

      if (concatenatedVideoPath) {
        await unlinkAsync(concatenatedVideoPath);
      }

      if (downloadPaths.length > 0) {
      }

      downloadPaths.forEach(async (paths) => {
        await unlinkAsync(paths);
      });

      if (err.name === "ValidationError") {
        err.statusCode = httpStatus.BAD_REQUEST;
      }
      next(err);
    }
  },

  async getVideoLink(req, res, next) {
    try {
      const bucketName = process.env.BUCKET_NAME;
      let values = await getVideoLinkSchema.validateAsync({ id: req.query.id });

      let findVideo = await services.videoService.findVideoById(values.id);

      if (findVideo === null) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Video with this id - ${values.id} does not exist`
        );
      }

      console.log(findVideo);
      let url = await services.videoService.getFilesUrlFromS3(bucketName, findVideo.videoId);

      res.status(httpStatus.OK).send({ url, expiresIn: "3600s" });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = videoController;
