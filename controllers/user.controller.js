const httpStatus = require("http-status");
const user = require("../db/models/user");
const { userRegisterSchema, userSigninSchema } = require("../validations/userValidations");
const { ApiError } = require("../middlewares/errorHandlingMiddleware");
const services = require("../services/index");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const userController = {
  async registerUser(req, res, next) {
    const t = await sequelize.transaction();
    try {
      let values = await userRegisterSchema.validateAsync(req.body);

      await services.userService.checkUserExists(values.email);

      let newUser = await user.create({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      await t.commit();

      res.status(httpStatus.OK).send(newUser);
    } catch (err) {
      console.log(err);
      await t.rollback();
      if (err.name === "ValidationError") {
        err.statusCode = httpStatus.BAD_REQUEST;
      }
      next(err);
    }
  },
  async signinUser(req, res, next) {
    try {
      let values = await userSigninSchema.validateAsync(req.body);

      let userExists = await services.userService.findUserByEmail(values.email);

      if (userExists === false || !(await bcrypt.compare(values.password, userExists.password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Email or Password Incorrect");
      }

      const token = services.userService.generateToken({ id: userExists.id });
      delete userExists.password;
      delete userExists.deletedAt;
      res.status(httpStatus.OK).send({ userExists, token });
    } catch (err) {
      if (err.name === "ValidationError") {
        err.statusCode = httpStatus.BAD_REQUEST;
      }
      next(err);
    }
  },
};

module.exports = userController;
