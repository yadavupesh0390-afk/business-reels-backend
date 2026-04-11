const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ================== MULTER ==================
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// ================== AUTH ==================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token ❌" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ error: "Invalid token ❌" });
  }
};

// ================== UPLOAD REEL ==================
router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  try {
    console.log("👉 HIT /upload");

    if (!req.file) {
      return res.status(400).json({ error: "Video missing ❌" });
    }

    const { businessName, website, whatsapp, city, lat, lng } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: "Business name required ❌" });
    }

    // ================== CLOUDINARY ==================
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "reels"
    });

    console.log("CLOUDINARY DONE:", result.secure_url);

    // delete temp file
    fs.unlinkSync(req.file.path);

    // ================== SAVE DB ==================
    const reel = new Reel({
      userId: req.user.id,

      // ✅ FRONTEND CITY (fallback to token)
      city: city || req.user.city || "Unknown",

      // ✅ GEO LOCATION (future use)
      lat: lat || null,
      lng: lng || null,

      videoUrl: result.secure_url,
      businessName,
      website,

      // ✅ WHATSAPP (frontend + fallback)
      whatsapp: whatsapp || "919473549700",

      whatsappClicks: 0,
      websiteClicks: 0,
      createdAt: new Date()
    });

    await reel.save();

    return res.json({
      message: "Upload success 🚀",
      videoUrl: result.secure_url
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({
      error: "Upload failed ❌",
      details: err.message
    });
  }
});

// ================== GET REELS ==================
router.get("/", async (req, res) => {
  try {
    const { city } = req.query;

    let filter = {};

    // ✅ ONLY CITY FILTER
    if (city) {
      filter.city = city;
    }

    const reels = await Reel.find(filter).sort({ createdAt: -1 });

    res.json(reels);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Fetch failed ❌" });
  }
});

module.exports = router;
