const mongoose = require("mongoose");

const ReelSchema = new mongoose.Schema({
  userId: { type: String, required: true },        // Kaun upload kiya
  city: { type: String },
  videoUrl: { type: String, required: true },      // Reel ka URL
  businessName: { type: String, required: true },
  website: { type: String },                       // Business website
  category: { type: String, default: "all" },
  createdAt: { type: Date, default: Date.now },
  whatsapp: { type: String, required: false}
});

module.exports = mongoose.model("Reel", ReelSchema);
