const mongoose = require("mongoose");

const ReelSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  city: { type: String },
  videoUrl: { type: String, required: true },
  businessName: { type: String, required: true },
  website: { type: String },
  category: { type: String, default: "all" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reel", ReelSchema);
