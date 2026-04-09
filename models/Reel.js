const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema({
  videoUrl: String,
  category: String,
  city: String,
  businessName: String,
  website: String
});

module.exports = mongoose.model("Reel", reelSchema);
