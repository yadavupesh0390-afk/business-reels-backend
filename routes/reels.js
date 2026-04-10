const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// LOCAL STORAGE
const upload = multer({ dest: "uploads/" });

// AUTH
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token ❌" });
  }
};

// UPLOAD
router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "No video ❌" });
    }

    console.log("FILE:", req.file); // DEBUG

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "reels"
    });

    fs.unlinkSync(req.file.path);

    const { businessName, website, category, whatsapp } = req.body;

    const reel = new Reel({
      userId: req.user.id,
      city: req.user.city,
      videoUrl: result.secure_url,
      businessName,
      website,
      category,
      whatsapp,
      whatsappClicks: 0,
      websiteClicks: 0
    });

    await reel.save();

    res.json({
      message: "Upload success 🚀",
      videoUrl: result.secure_url
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed ❌" });
  }
});
