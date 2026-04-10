const express = require("express");
const router = express.Router();
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// ================== MULTER CONFIG ==================

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "reels",
    resource_type: "video"
  }
});

const upload = multer({ storage });

// ================== UPLOAD REEL ==================
router.post("/upload", upload.single("video"), async (req, res) => {
  try {

    const authHeader = req.headers.authorization;
    if(!authHeader) return res.status(401).json({ error: "Unauthorized ❌" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { businessName, website, category, whatsapp } = req.body;

    const videoUrl = req.file.path; // 🔥 cloudinary URL

    const newReel = new Reel({
      userId: decoded.id,
      city: decoded.city,
      videoUrl,
      businessName,
      website,
      category,
      whatsapp
    });

    await newReel.save();

    res.json({ message: "Uploaded to Cloudinary 🚀", videoUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed ❌" });
  }
});


// ================== GET REELS ==================
router.get("/", async (req, res) => {
  try {
    const { category, city } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (city) filter.city = city;

    const reels = await Reel.find(filter).sort({ createdAt: -1 });

    res.json(reels);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reels ❌" });
  }
});


// ================== WHATSAPP CLICK TRACK ==================
router.post("/click/whatsapp/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ error: "Reel not found ❌" });
    }

    reel.whatsappClicks = (reel.whatsappClicks || 0) + 1;

    await reel.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating WhatsApp clicks ❌" });
  }
});


// ================== WEBSITE CLICK TRACK ==================
router.post("/click/website/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ error: "Reel not found ❌" });
    }

    reel.websiteClicks = (reel.websiteClicks || 0) + 1;

    await reel.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating Website clicks ❌" });
  }
});

module.exports = router;
