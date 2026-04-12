const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cloudinary = require("../config/cloudinary");
const OpenAI = require("openai");

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ================= AI CAPTION =================
async function generateCaption(name, type = "business") {
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

  } catch (err) {
    console.log("Caption error:", err.message);
    return `🔥 Visit ${name} Today\nBest Service 💯`;
  }
}

// ================= SAFE MUSIC =================
function getMusic() {
  const list = [
    path.join(__dirname, "../music/song1.mp3")
  ];

  const exists = list.filter(f => fs.existsSync(f));

  if (exists.length === 0) {
    return null; // no crash mode
  }

  return exists[Math.floor(Math.random() * exists.length)];
}

// ================= AI REEL =================
router.post("/generate-reel", upload.single("image"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "Image required ❌" });
    }

    const { businessName = "Your Business", type = "shop" } = req.body;

    const imagePath = req.file.path;
    const outputVideo = path.join(__dirname, `../uploads/output-${Date.now()}.mp4`);

    const captionRaw = await generateCaption(businessName, type);

    const caption = captionRaw
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n");

    const music = getMusic();

    // ================= FFmpeg =================
    await new Promise((resolve, reject) => {

      let command = ffmpeg()
        .input(imagePath)
        .loop(6)
        .outputOptions([
          "-vf",
          "scale=720:1280", // 🔥 SAFE (NO CRASH drawtext removed)
          "-t 6",
          "-preset ultrafast",
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-movflags +faststart"
        ]);

      // 🎵 music optional
      if (music) {
        command = command
          .input(music)
          .inputOptions(["-stream_loop", "-1"])
          .outputOptions(["-c:a aac", "-shortest"]);
      }

      command
        .save(outputVideo)
        .on("end", resolve)
        .on("error", (err) => {
          console.log("FFMPEG ERROR:", err.message);
          reject(err);
        });
    });

    // ================= CLOUDINARY =================
    const result = await cloudinary.uploader.upload(outputVideo, {
      resource_type: "video",
      folder: "ai-reels"
    });

    // cleanup
    fs.unlinkSync(imagePath);
    fs.unlinkSync(outputVideo);

    return res.json({
      message: "🔥 AI Reel Generated",
      videoUrl: result.secure_url,
      caption: captionRaw
    });

  } catch (err) {
    console.log("AI ERROR:", err.message);
    return res.status(500).json({
      error: err.message || "AI failed ❌"
    });
  }
});

/* ================= MANUAL UPLOAD ROUTE =================
   👉 Yeh add karo agar manual upload already use ho raha hai
*/
router.post("/upload-manual", upload.single("video"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "Video required ❌" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "manual-reels"
    });

    fs.unlinkSync(req.file.path);

    return res.json({
      message: "✅ Manual Upload Success",
      videoUrl: result.secure_url
    });

  } catch (err) {
    console.log("Manual Upload Error:", err.message);
    return res.status(500).json({
      error: "Manual upload failed ❌"
    });
  }
});

module.exports = router;
