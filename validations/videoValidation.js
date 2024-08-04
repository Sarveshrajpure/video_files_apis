const Joi = require("joi");

const uploadVideoSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid("video/webm", "video/mp4").required().messages({
      "any.only": "Invalid Video format, allowed formats - mp4,webm",
    }),
    filename: Joi.string().required(),
    encoding: Joi.string().required(),
    destination: Joi.string().required(),
    path: Joi.string().required(),
    size: Joi.number().required(),
  }).required(),
});

module.exports = { uploadVideoSchema };