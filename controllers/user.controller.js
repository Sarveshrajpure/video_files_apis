const httpStatus = require("http-status");
const user = require("../db/models/user");
const { userRegisterSchema } = require("../validations/userValidations");
const { convertToApiError, ApiError } = require("../middlewares/errorHandlingMiddleware");
const services = require("../services/index");
const sequelize = require("../config/database");

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
      await t.rollback();
      console.log(err);
      next(err);
    }
  },
};

module.exports = userController;
