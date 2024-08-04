const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
  dialect: "sqlite",
  host: "localhost",
  storage: "../database/database.sqlite",
  logging: console.log,
});

module.exports = sequelize;
