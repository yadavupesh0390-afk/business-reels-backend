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

// ================= OPENAI =================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ================= CAPTION AI =================
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
  try {
    const musicPath = path.join(process.cwd(), "music/song1.mp3");

    if (!fs.existsSync(musicPath)) return null;

    return musicPath;
  } catch {
    return null;
  }
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
          "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
          "-t 6",
          "-preset ultrafast",
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-movflags +faststart"
        ]);

      // 🎵 MUSIC OPTIONAL
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

// ================= MANUAL UPLOAD =================
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

module.exports = router;          console.log("FFMPEG ERROR:", err.message);
          reject(err);
        });
    });

    const result = await cloudinary.uploader.upload(outputVideo, {
      resource_type: "video",
      folder: "ai-reels"
    });

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

// ================= MANUAL UPLOAD =================
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

module.exports = router;          .inputOptions(["-stream_loop", "-1"])
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

    // cleanup safely
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

// ================= MANUAL UPLOAD =================
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
