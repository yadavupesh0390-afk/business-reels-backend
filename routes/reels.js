const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ================== LOCAL UPLOAD TEMP ==================
const upload = multer({ dest: "uploads/" });

// ================== AUTH MIDDLEWARE ==================
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
    console.error("JWT ERROR:", err);
    return res.status(401).json({ error: "Invalid token ❌" });
  }
};

// ================== UPLOAD REEL ==================
router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  try {

    console.log("FILE DEBUG:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "Video file missing ❌" });
    }

    const { businessName, website, category, whatsapp } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: "Business name required ❌" });
    }

    // ================== CLOUDINARY UPLOAD ==================
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "reels"
    });

    // delete temp file
    fs.unlinkSync(req.file.path);

    // ================== SAVE TO DB ==================
    const reel = new Reel({
      userId: req.user.id,
      city: req.user.city || "",
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

// ================== CLICK TRACKING ==================
router.post("/click/whatsapp/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ error: "Not found ❌" });

    reel.whatsappClicks = (reel.whatsappClicks || 0) + 1;
    await reel.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Error ❌" });
  }
});

router.post("/click/website/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ error: "Not found ❌" });

    reel.websiteClicks = (reel.websiteClicks || 0) + 1;
    await reel.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Error ❌" });
  }
});

module.exports = router;
