const httpStatus = require("http-status");
const video = require("../db/models/video");
const { uploadVideoSchema } = require("../validations/videoValidation");
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe");
const path = require("path");
const { promisify } = require("util");
const fs = require("fs");
const unlinkAsync = promisify(fs.unlink);
const services = require("../services/index");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");
const sequelize = require("../config/database");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const videoController = {
  async uploadVideo(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const file = req.file;

      let values = await uploadVideoSchema.validateAsync({ name: req.body.name, file: file });
      const userId = req.authenticated.id;
      const bucket_name = process.env.BUCKET_NAME;
      const fileName = `${bucket_name}/${values.file.filename}`;

      let videoDuration = await services.videoService.getVideoDuration(values.file.path);

      if (videoDuration > 25) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Video Duration should be less then 25sec");
      } else if (videoDuration < 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Video Duration should be atleast 2sec");
      }

      await services.videoService.uploadVideo(
        bucket_name,
        values.file.filename,
        values.file.path,
        values.file.mimetype
      );

      //  adding record in video model

      let videoCreated = await video.create({
        name: values.name,
        videoId: fileName,
        userId: userId,
      });

      let fileUrl = await services.videoService.getFilesUrlFromS3(
        bucket_name,
        values.file.filename
      );

      let response = videoCreated.toJSON();
      response.url = fileUrl;

      res.status(httpStatus.OK).send(response);
      await t.commit();
      await unlinkAsync(file.path);
    } catch (err) {
      console.log(err);
      await t.rollback();
      next(err);
    }
  },
};

module.exports = videoController;
