const express = require("express");
const router = express.Router();
const Reel = require("../models/Reel");
const jwt = require("jsonwebtoken");

// ================== UPLOAD REEL ==================
router.post("/upload", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if(!authHeader) return res.status(401).json({ error: "Unauthorized ❌" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ whatsapp add
    const { videoUrl, businessName, website, category, whatsapp } = req.body;

    if(!videoUrl || !businessName){
      return res.status(400).json({ error: "Missing fields ❌" });
    }

    const newReel = new Reel({
      userId: decoded.id,
      city: decoded.city,
      videoUrl,
      businessName,
      website,
      category,
      whatsapp, // ✅ NEW FIELD
      whatsappClicks: 0, // optional
      websiteClicks: 0   // optional
    });

    await newReel.save();
    res.json({ message: "Reel uploaded ✅" });

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

    if(category && category !== "all") filter.category = category;
    if(city) filter.city = city;

    const reels = await Reel.find(filter).sort({ createdAt: -1 });
    res.json(reels);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reels ❌" });
  }
});


// ================== WHATSAPP CLICK TRACK ==================
router.post("/click/whatsapp/:id", async (req,res)=>{
  try{
    const reel = await Reel.findById(req.params.id);
    if(!reel) return res.status(404).json({error:"Not found"});

    reel.whatsappClicks = (reel.whatsappClicks || 0) + 1;
    await reel.save();

    res.json({success:true});
  }catch(err){
    res.status(500).json({error:"Error"});
  }
});


// ================== WEBSITE CLICK TRACK ==================
router.post("/click/website/:id", async (req,res)=>{
  try{
    const reel = await Reel.findById(req.params.id);
    if(!reel) return res.status(404).json({error:"Not found"});

    reel.websiteClicks = (reel.websiteClicks || 0) + 1;
    await reel.save();

    res.json({success:true});
  }catch(err){
    res.status(500).json({error:"Error"});
  }
});


module.exports = router;
