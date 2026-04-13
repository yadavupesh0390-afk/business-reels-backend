const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Reel = require("../models/Reel");
const Music = require("../models/Music");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const ffmpeg = require("fluent-ffmpeg");

// ================== MULTER ==================
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }
});

// ================== AUTH ==================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token ❌" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch {
    return res.status(401).json({ error: "Invalid token ❌" });
  }
};

//
// ================== 🔥 PRO REEL GENERATOR ==================
//
router.post("/create-pro", verifyToken, upload.fields([
  { name: "images" },
  { name: "music" }
]), async (req, res) => {

  try {

    const images = req.files["images"];
    const music = req.files["music"]?.[0];

    if (!images || images.length === 0) {
      return res.status(400).json({ error: "No images ❌" });
    }

    const output = `output_${Date.now()}.mp4`;
    const listFile = `list_${Date.now()}.txt`;

    // 🖼 IMAGE LIST
    let list = "";
    images.forEach(img => {
      list += `file '${img.path}'\n`;
      list += `duration 2\n`;
    });

    fs.writeFileSync(listFile, list);

    let command = ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions([
        "-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-pix_fmt yuv420p",
        "-r 30"
      ]);

    // 🎵 ADD MUSIC
    if (music) {
      command
        .input(music.path)
        .outputOptions([
          "-map 0:v:0",
          "-map 1:a:0",
          "-shortest"
        ]);
    }

    command
      .save(output)
      .on("end", async () => {

        // ☁️ Upload to Cloudinary
        const result = await cloudinary.uploader.upload(output, {
          resource_type: "video",
          folder: "reels"
        });

        // 🧹 CLEANUP
        images.forEach(f => fs.unlinkSync(f.path));
        if (music) fs.unlinkSync(music.path);
        fs.unlinkSync(listFile);
        fs.unlinkSync(output);

        // 💾 SAVE DB
        const reel = new Reel({
          userId: req.user.id,
          videoUrl: result.secure_url,
          businessName: "Auto Reel",
          website: "",
          whatsapp: "919473549700",
          createdAt: new Date()
        });

        await reel.save();

        res.json({
          message: "🔥 PRO Reel Created",
          videoUrl: result.secure_url
        });

      })
      .on("error", err => {
        console.log(err);
        res.status(500).json({ error: "FFmpeg Error ❌" });
      });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error ❌" });
  }
});

//
// ================== REEL UPLOAD ==================
router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
  try {

    if (!req.file) return res.status(400).json({ error: "Video missing ❌" });

    const { businessName, website, whatsapp, city, lat, lng } = req.body;

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "reels"
    });

    fs.unlinkSync(req.file.path);

    const reel = new Reel({
      userId: req.user.id,
      city: city || "Unknown",
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      videoUrl: result.secure_url,
      businessName,
      website,
      whatsapp: whatsapp || "919473549700",
      createdAt: new Date()
    });

    await reel.save();

    res.json({ message: "Upload success 🚀", videoUrl: result.secure_url });

  } catch (err) {
    res.status(500).json({ error: "Upload failed ❌" });
  }
});

//
// ================== MUSIC ==================
router.post("/music/add", async (req, res) => {
  try {
    const { name, url } = req.body;

    const music = new Music({ name, url });
    await music.save();

    res.json({ message: "Music added ✅", music });

  } catch {
    res.status(500).json({ error: "Music add failed ❌" });
  }
});

router.get("/music", async (req, res) => {
  const music = await Music.find().sort({ createdAt: -1 });
  res.json(music);
});

//
// ================== GET REELS ==================
router.get("/", async (req, res) => {
  try {
    const reels = await Reel.find().sort({ createdAt: -1 });
    res.json(reels);
  } catch {
    res.status(500).json({ error: "Fetch failed ❌" });
  }
});

module.exports = router;
