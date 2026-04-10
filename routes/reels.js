const express = require("express");
const router = express.Router();
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ================== CLOUDINARY STORAGE ==================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "reels",
    resource_type: "video",
    format: async () => "mp4",
    public_id: (req, file) => Date.now() + "-" + file.originalname
  }
});

const upload = multer({ storage });

// ================== AUTH MIDDLEWARE ==================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized ❌" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({ error: "Invalid token ❌" });
  }
};

// ================== UPLOAD REEL ==================
router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "Video file missing ❌" });
    }

    const { businessName, website, category, whatsapp } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: "Business name required ❌" });
    }

    const newReel = new Reel({
      userId: req.user.id,
      city: req.user.city || "",
      videoUrl: req.file.path, // Cloudinary URL
      businessName,
      website,
      category,
      whatsapp,
      whatsappClicks: 0,
      websiteClicks: 0
    });

    await newReel.save();

    res.json({
      message: "Reel uploaded successfully 🚀",
      videoUrl: req.file.path
    });

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

// ================== WHATSAPP CLICK ==================
router.post("/click/whatsapp/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ error: "Not found ❌" });

    reel.whatsappClicks = (reel.whatsappClicks || 0) + 1;
    await reel.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error ❌" });
  }
});

// ================== WEBSITE CLICK ==================
router.post("/click/website/:id", async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ error: "Not found ❌" });

    reel.websiteClicks = (reel.websiteClicks || 0) + 1;
    await reel.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error ❌" });
  }
});

module.exports = router;
