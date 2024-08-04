const httpStatus = require("http-status");
const user = require("../db/models/user");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const checkUserExists = async (email) => {
  try {
    let checkUser = await user.findOne({
      where: { email: email },
      attributes: ["id", "email"],
    });

    if (checkUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists!");
    }
  } catch (err) {
    throw err;
  }
};

const findUserByEmail = async (email) => {
  try {
    let fetchedUser = await user.findOne({ where: { email }, raw: true });

    if (fetchedUser !== null) {
      return fetchedUser;
    } else {
      return false;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = { checkUserExists, findUserByEmail, generateToken };
