const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cloudinary = require("../config/cloudinary");
const OpenAI = require("openai");

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🔥 AI CAPTION (REAL AI)
async function generateCaption(name, type = "business"){
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Create short viral Instagram reel caption for a ${type} business named ${name}. Add emojis. Max 2 lines.`
        }
      ]
    });

    return res.choices[0].message.content;

  } catch {
    return `🔥 Visit ${name} Today\nBest Service 💯`;
  }
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

    const { businessName = "Your Business", type = "shop" } = req.body;

    const imagePath = req.file.path;
    const outputVideo = `uploads/output-${Date.now()}.mp4`;

    const captionRaw = await generateCaption(businessName, type);

    // 🔥 TEXT SAFE (FFMPEG crash fix)
    const caption = captionRaw
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n");

    const music = getMusic();

    // 🎬 VIDEO GENERATE
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop(6)
        .input(music)
        .outputOptions([
          "-vf",
          `scale=720:1280,drawtext=text='${caption}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=1000`,
          "-t 6",
          "-preset ultrafast",
          "-c:v libx264",
          "-c:a aac",
          "-shortest"
        ])
        .save(outputVideo)
        .on("end", resolve)
        .on("error", reject);
    });

    // ☁️ CLOUDINARY UPLOAD
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
      caption: captionRaw
    });

  } catch (err) {
    console.log("AI ERROR:", err);
    res.status(500).json({ error: "AI failed ❌" });
  }
});

module.exports = router;
