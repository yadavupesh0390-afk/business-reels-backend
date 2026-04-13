const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Reel = require("../models/Reel");
const Music = require("../models/Music");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ================== MULTER ==================
const upload = multer({
dest: "uploads/",
limits: {
fileSize: 100 * 1024 * 1024 // 100MB
}
});

// ================== AUTH ==================
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
return res.status(401).json({ error: "Invalid token ❌" });
}
};

//
// ================== REEL UPLOAD ==================
//
router.post("/upload", verifyToken, upload.single("video"), async (req, res) => {
try {

if (!req.file) {  
  return res.status(400).json({ error: "Video missing ❌" });  
}  

const { businessName, website, whatsapp, city, lat, lng } = req.body;  

if (!businessName) {  
  return res.status(400).json({ error: "Business name required ❌" });  
}  

const result = await cloudinary.uploader.upload(req.file.path, {  
  resource_type: "video",  
  folder: "reels"  
});  

if (fs.existsSync(req.file.path)) {  
  fs.unlinkSync(req.file.path);  
}  

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

res.json({  
  message: "Upload success 🚀",  
  videoUrl: result.secure_url  
});

} catch (err) {
res.status(500).json({ error: "Upload failed ❌", details: err.message });
}
});

//
// ================== AI / URL UPLOAD ==================
//
router.post("/upload-url", verifyToken, async (req, res) => {
try {

const { videoUrl, businessName, website, whatsapp, city, lat, lng } = req.body;  

if (!videoUrl || !businessName) {  
  return res.status(400).json({ error: "Missing fields ❌" });  
}  

const reel = new Reel({  
  userId: req.user.id,  
  city: city || "Unknown",  
  lat: lat ? Number(lat) : null,  
  lng: lng ? Number(lng) : null,  
  videoUrl,  
  businessName,  
  website,  
  whatsapp: whatsapp || "919473549700",  
  createdAt: new Date()  
});  

await reel.save();  

res.json({  
  message: "AI Reel saved ✅",  
  videoUrl  
});

} catch (err) {
res.status(500).json({ error: "Upload failed ❌" });
}
});

//
// ================== MUSIC ADD (ADMIN) ==================
//
router.post("/music/add", async (req, res) => {
try {

const { name, url } = req.body;  

if (!name || !url) {  
  return res.status(400).json({ error: "Name & URL required ❌" });  
}  

const music = new Music({  
  name,  
  url  
});  

await music.save();  

res.json({  
  message: "Music added ✅",  
  music  
});

} catch (err) {
res.status(500).json({ error: "Music add failed ❌" });
}
});

//
// ================== GET MUSIC (FRONTEND) ==================
//
router.get("/music", async (req, res) => {
try {

const music = await Music.find().sort({ createdAt: -1 });  

res.json(music);

} catch (err) {
res.status(500).json({ error: "Music fetch failed ❌" });
}
});

//
// ================== GET REELS ==================
//
function getDistance(lat1, lng1, lat2, lng2) {
const R = 6371;
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLng = (lng2 - lng1) * Math.PI / 180;

const a =
Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1 * Math.PI / 180) *
Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLng/2) * Math.sin(dLng/2);

return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

router.get("/", async (req, res) => {
try {

const { city, lat, lng } = req.query;  

let reels = await Reel.find();  

if (lat && lng) {  
  reels = reels  
    .map(r => ({  
      ...r._doc,  
      distance: (r.lat && r.lng)  
        ? getDistance(lat, lng, r.lat, r.lng)  
        : 9999  
    }))  
    .sort((a, b) => a.distance - b.distance);  
}  

else if (city) {  
  reels = reels.filter(r => r.city === city);  
}  

else {  
  reels = reels.sort((a, b) => b.createdAt - a.createdAt);  
}  

res.json(reels);

} catch (err) {
res.status(500).json({ error: "Fetch failed ❌" });
}
});

module.exports = router;
