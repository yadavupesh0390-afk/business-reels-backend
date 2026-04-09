const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, city } = req.body;

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, city });
    await user.save();

    res.json({ message: "User created ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed ❌" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ error: "User not found ❌" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: "Wrong password ❌" });

    const token = jwt.sign(
      { id: user._id, city: user.city, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, city: user.city });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

module.exports = router;
