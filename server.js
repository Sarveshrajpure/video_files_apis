const express = require("express");
const sequelize = require("./config/database");
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

console.log(port);

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
