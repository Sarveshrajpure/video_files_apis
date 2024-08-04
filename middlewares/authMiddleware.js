const jwt = require("jsonwebtoken");
require("dotenv").config();
const httpStatus = require("http-status");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");

const auth = () => async (req, res, next) => {
  try {
    let token = req.headers["authorization"];

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized user!");
    }

    let accessToken = token.split(" ")[1];

    let validToken = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

    if (validToken && accessToken) {
      req.authenticated = validToken;
      next();
    }
  } catch (err) {
    next(err);
  }
};

module.exports = auth;
