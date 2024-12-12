const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  admin: Boolean,
  isTeam: Boolean,
  team_type: String,
  cart: Array,
  team_orders: Array,
});

const UsersModel = mongoose.model("Users", UserSchema);

module.exports = UsersModel;