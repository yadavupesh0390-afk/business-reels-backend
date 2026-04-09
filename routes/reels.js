const express = require("express");
const router = express.Router();
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");

// UPLOAD REEL
router.post("/upload", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if(!authHeader) return res.status(401).json({ error: "Unauthorized ❌" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { videoUrl, businessName, website, category } = req.body;

    if(!videoUrl || !businessName) return res.status(400).json({ error: "Missing fields ❌" });

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
    console.error(err);
    res.status(500).json({ error: "Upload failed ❌" });
  }
});

// GET Reels
router.get("/", async (req, res) => {
  try {
    const { category, city } = req.query;
    const filter = {};

    if(category && category !== "all") filter.category = category;
    if(city) filter.city = city;

    const reels = await Reel.find(filter).sort({ createdAt: -1 });
    res.json(reels);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reels ❌" });
  }
});

module.exports = router;
