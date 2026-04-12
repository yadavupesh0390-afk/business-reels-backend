const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");
const cloudinary = require("../config/cloudinary");

const upload = multer({ dest: "uploads/" });

// 🔥 SIMPLE AI CAPTION (later upgrade karenge)
function generateCaption(businessType, businessName) {

  const captions = {
    salon: `💇‍♂️ Stylish Look @ ${businessName} 🔥 Visit Today!`,
    gym: `💪 Transform Yourself @ ${businessName} 🚀 Join Now!`,
    shop: `🛍 Amazing Deals @ ${businessName} 🔥 Hurry Up!`,
    default: `🔥 Visit ${businessName} Today!`
  };

  return captions[businessType] || captions.default;
}

// 🔥 MUSIC AUTO SELECT
function getMusic(businessType){
  if(businessType === "gym") return "music/gym.mp3";
  if(businessType === "salon") return "music/salon.mp3";
  return "music/default.mp3";
}

// ================= AI REEL =================
router.post("/generate-reel", upload.single("image"), async (req, res) => {
  try {

    const { businessType, businessName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image required ❌" });
    }

    const inputImage = req.file.path;
    const outputVideo = `uploads/output-${Date.now()}.mp4`;

    const caption = generateCaption(businessType, businessName);
    const music = getMusic(businessType);

    // 🔥 FFmpeg COMMAND
    const command = `
    ffmpeg -loop 1 -i ${inputImage} -i ${music} \
    -vf "scale=720:1280,drawtext=text='${caption}':fontcolor=white:fontsize=40:x=50:y=1100" \
    -t 5 -c:v libx264 -c:a aac -shortest ${outputVideo}
    `;

    exec(command, async (err) => {

      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Video generation failed ❌" });
      }

      // ☁️ Upload
      const result = await cloudinary.uploader.upload(outputVideo, {
        resource_type: "video",
        folder: "ai-reels"
      });

      // 🧹 cleanup
      fs.unlinkSync(inputImage);
      fs.unlinkSync(outputVideo);

      res.json({
        message: "AI Reel Generated 🚀",
        videoUrl: result.secure_url,
        caption
      });

    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI failed ❌" });
  }
});

module.exports = router;
