const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

// ================== UPLOADS FOLDER AUTO CREATE ==================
const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
  console.log("Uploads folder created ✅");
}

// ================== STATIC FILE SERVE ==================
app.use("/uploads", express.static(uploadPath));

// ================== TEST ROUTE ==================
app.get("/", (req, res) => res.send("API Running 🚀"));

// ================== DATABASE ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("DB Error ❌:", err));

// ================== ROUTES ==================
app.use("/auth", require("./routes/auth"));
app.use("/reels", require("./routes/reels"));

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
