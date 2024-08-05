const express = require("express");
const sequelize = require("./config/database");
const { convertToApiError, handleError } = require("./middlewares/errorHandlingMiddleware");
const routes = require("./routes/index");
const app = express();
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API ROUTE
app.use("/api", routes);

//API ERROR HANDLING
app.use(convertToApiError);
app.use((err, req, res, next) => {
  handleError(err, res);
});

const port = process.env.PORT;

const connectDb = async () => {
  console.log("Checking database connection...");
  await sequelize.authenticate();
  console.log("Database connection established!");
  try {
  } catch (err) {
    console.log("Database connection failed!", err);
    process.exit(1);
  }
};

(async () => {
  await connectDb();

  console.log(`Attempting to run server on port ${port}...`);
  app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
  });
})();

module.exports = app;
