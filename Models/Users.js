const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  admin: Boolean,
});

const UsersModel = mongoose.model("Users", UserSchema);

module.exports = UsersModel;
