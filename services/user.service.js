const httpStatus = require("http-status");
const user = require("../db/models/user");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");

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

module.exports = { checkUserExists };
