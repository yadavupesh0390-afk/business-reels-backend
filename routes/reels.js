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

    // delete temp file
    fs.unlinkSync(req.file.path);

    // ================== SAVE DB ==================
    const reel = new Reel({
      userId: req.user.id,

      city: city || req.user.city || "Unknown",

      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,

      videoUrl: result.secure_url,
      businessName,
      website,

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

// ================== DISTANCE FUNCTION ==================
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ================== GET REELS ==================
router.get("/", async (req, res) => {
  try {

    const { city, lat, lng } = req.query;

    let reels = await Reel.find();

    // ✅ 1. DISTANCE SORT (BEST EXPERIENCE)
    if (lat && lng) {

      const userLat = Number(lat);
      const userLng = Number(lng);

      reels = reels
        .map(r => {
          if (r.lat && r.lng) {
            return {
              ...r._doc,
              distance: getDistance(userLat, userLng, r.lat, r.lng)
            };
          } else {
            return {
              ...r._doc,
              distance: 9999 // far
            };
          }
        })
        .sort((a, b) => a.distance - b.distance);

    }

    // ✅ 2. CITY FILTER (fallback)
    else if (city) {
      reels = reels
        .filter(r => r.city === city)
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    // ✅ 3. DEFAULT (latest)
    else {
      reels = reels.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json(reels);

  } catch (err) {
    console.log("FETCH ERROR:", err);
    res.status(500).json({ error: "Fetch failed ❌" });
  }
});

module.exports = router;
