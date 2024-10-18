const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const UsersModel = require("./Models/Users");

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

mongoose.connect("mongodb://localhost:27017/LogIn");

app.post("/Register", (req, res) => {
  UsersModel.create(req.body)
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

app.post("/LogIn", (req, res) => {
  const { email, password } = req.body;
  UsersModel.findOne({ email: email })
    .then((users) => {
      if (users.password === password) {
        if (users.admin === true) {
          res.json({
            type: "success",
            admin: true,
            username: users.username,
            message: "Admin Login Success",
          });
        } else {
          res.json({
            type: "success",
            username: users.username,
            admin: false,
            message: "user Login Success",
          });
        }
      } else {
        res.json({ type: "error", message: "Invalid Password" });
      }
    })
    .catch((err) => res.json({ type: "error", message: "User Not Found" }));
});

app.get("/", (req, res) => {
  res.send("Hello World from Zaid");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
