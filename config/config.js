require("dotenv").config({ path: `${process.cwd()}/.env` });

module.exports = {
  development: {
    storage: "development.db",
    dialect: "sqlite",
  },
  test: {
    storage: "test.db",
    dialect: "sqlite",
  },
  production: {
    storage: "production.db",
    dialect: "sqlite",
  },
};
