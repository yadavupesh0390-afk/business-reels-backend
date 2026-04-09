const express = require("express");
const router = express.Router();
const Reel = require("../models/Reel"); // MongoDB schema
const jwt = require("jsonwebtoken");

// 🔹 Upload reel
router.post("/upload", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if(!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { videoUrl, businessName, website, category } = req.body;

    const newReel = new Reel({
      userId: decoded.id,
      city: decoded.city,
      videoUrl,
      businessName,
      website,
      category
    });

    await newReel.save();
    res.json({ message: "Reel uploaded ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload failed ❌" });
  }
});

module.exports = router;
