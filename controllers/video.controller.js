const httpStatus = require("http-status");

const videoController = {
  async uploadVideo(req, res, next) {
    try {
      res.status(httpStatus.OK).send("in upload video");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = videoController;
