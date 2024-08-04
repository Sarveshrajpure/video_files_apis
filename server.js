const express = require("express");

const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

console.log(port);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});