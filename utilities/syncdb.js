const user = require("../database/models/user");

user.sync({ alter: true });
