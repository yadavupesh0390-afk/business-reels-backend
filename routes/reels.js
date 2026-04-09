const express = require("express");
const router = express.Router();
const Reel = require("../models/Reel");

// GET reels (category + city)
router.get("/", async (req, res) => {
  const { category, city } = req.query;

  let filter = {};
  if (category && category !== "all") filter.category = category;
  if (city) filter.city = city;

  const reels = await Reel.find(filter);
  res.json(reels);
});

// UPLOAD reel
router.post("/upload", async (req, res) => {
  const reel = new Reel(req.body);
  await reel.save();
  res.json({ message: "Reel uploaded" });
});

module.exports = router;
