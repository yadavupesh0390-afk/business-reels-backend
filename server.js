const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ================== STATIC MUSIC FILES ==================
app.use("/music", express.static(path.join(__dirname, "public/music")));

// ================== DYNAMIC MUSIC LIST API ==================
app.get("/music-list", (req, res) => {
  const musicPath = path.join(__dirname, "public/music");

  fs.readdir(musicPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Cannot read music folder ❌" });
    }

    const musicList = files
      .filter(file => file.endsWith(".mp3"))
      .map(file => ({
        name: file.replace(".mp3", ""),
        url: `/music/${file}`
      }));

    res.json(musicList);
  });
});

// ================== TEST ROUTE ==================
app.get("/", (req, res) => {
  res.send("🚀 Business Reels API Running");
});

// ================== DATABASE ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("DB Error ❌:", err));

// ================== ROUTES ==================
app.use("/auth", require("./routes/auth"));
app.use("/reels", require("./routes/reels"));

// ================== SERVER START ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
