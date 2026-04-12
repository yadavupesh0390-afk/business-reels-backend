const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cloudinary = require("../config/cloudinary");

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: "uploads/" });

// 🔥 AI CAPTION
function generateCaption(name){
  return `🔥 Visit ${name} Today | Best Service in Town 💯`;
}

// 🎵 RANDOM MUSIC
function getMusic(){
  const list = [
    "music/song1.mp3",
    "music/song2.mp3"
  ];
  return list[Math.floor(Math.random() * list.length)];
}

// ================= AI REEL =================
router.post("/generate-reel", upload.single("image"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "Image required ❌" });
    }

    const { businessName = "Your Business" } = req.body;

    const imagePath = req.file.path;
    const outputVideo = `uploads/output-${Date.now()}.mp4`;

    const caption = generateCaption(businessName);
    const music = getMusic();

    // 🎬 VIDEO GENERATE
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop(6)
        .input(music)
        .outputOptions([
          "-vf",
          `scale=720:1280,drawtext=text='${caption}':fontcolor=white:fontsize=40:x=50:y=1100`,
          "-t 6",
          "-c:v libx264",
          "-c:a aac",
          "-shortest"
        ])
        .save(outputVideo)
        .on("end", resolve)
        .on("error", reject);
    });

    // ☁️ UPLOAD
    const result = await cloudinary.uploader.upload(outputVideo, {
      resource_type: "video",
      folder: "ai-reels"
    });

    // 🧹 CLEANUP
    fs.unlinkSync(imagePath);
    fs.unlinkSync(outputVideo);

    res.json({
      message: "🔥 AI Reel Generated",
      videoUrl: result.secure_url,
      caption
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI failed ❌" });
  }
});

module.exports = router;
