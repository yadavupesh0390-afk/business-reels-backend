const express = require("express");
const router = express.Router();
const Music = require("../models/Music");

// GET ALL MUSIC
router.get("/", async (req, res) => {
  try {
    const music = await Music.find().sort({ createdAt: -1 });
    res.json(music);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch music" });
  }
});

// ADD MUSIC (ADMIN ONLY LATER)
router.post("/add", async (req, res) => {
  try {
    const { name, url } = req.body;

    const music = new Music({ name, url });
    await music.save();

    res.json({ message: "Music added", music });
  } catch (err) {
    res.status(500).json({ error: "Failed to add music" });
  }
});

module.exports = router;
