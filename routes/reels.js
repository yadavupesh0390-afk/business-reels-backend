const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Reel = require("../models/Reel");
const cloudinary = require("../config/cloudinary");

// ================== MULTER ==================
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// ================== UPLOAD ==================
router.post("/upload", upload.single("video"), async (req, res) => {

  try {

    // 🔴 CHECK FILE
    if (!req.file) {
      return res.status(400).json({ error: "Video missing ❌" });
    }

    const {
      businessName,
      website,
      whatsapp,
      city,
      lat,
      lng
    } = req.body;

    // 🔴 REQUIRED FIELD
    if (!businessName) {
      return res.status(400).json({ error: "Business name required ❌" });
    }

    // 🔥 CLOUDINARY UPLOAD
    let result;

    try {
      result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video",
        folder: "reels"
      });
    } catch (cloudErr) {
      console.log("❌ Cloudinary Error:", cloudErr);

      return res.status(500).json({
        error: "Cloudinary upload failed ❌",
        details: cloudErr.message
      });
    }

    // 🔥 DELETE TEMP FILE (SAFE)
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (delErr) {
      console.log("⚠️ File delete issue:", delErr);
    }

    // 🔥 SAVE DB
    const reel = new Reel({
  userId: "guest",   // 🔥 ADD THIS LINE
  businessName,
  website: website || "",
  whatsapp: whatsapp || "",
  city: city || "Unknown",
  lat: lat ? Number(lat) : null,
  lng: lng ? Number(lng) : null,
  videoUrl: result.secure_url,
  createdAt: new Date()
});

    await reel.save();

    // ✅ SUCCESS RESPONSE
    res.json({
      message: "Upload success 🚀",
      videoUrl: result.secure_url
    });

  } catch (err) {

    console.log("❌ SERVER ERROR:", err);

    res.status(500).json({
      error: "Upload failed ❌",
      details: err.message
    });
  }
});

// ================== GET REELS ==================
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

router.get("/", async (req, res) => {
  try {

    const { city, lat, lng } = req.query;

    let reels = await Reel.find();

    if (lat && lng) {
      reels = reels
        .map(r => ({
          ...r._doc,
          distance: (r.lat && r.lng)
            ? getDistance(lat, lng, r.lat, r.lng)
            : 9999
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    else if (city) {
      reels = reels.filter(r => r.city === city);
    }

    else {
      reels = reels.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json(reels);

  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
    res.status(500).json({ error: "Fetch failed ❌" });
  }
});

module.exports = router;
