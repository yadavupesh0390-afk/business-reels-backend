const mongoose = require("mongoose");

const ReelSchema = new mongoose.Schema({

  userId: { 
    type: String, 
    required: true,
    index: true
  },

  // 📍 Location
  city: { 
    type: String, 
    default: "Unknown"
  },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },

  // 🎬 Reel Data
  videoUrl: { 
    type: String, 
    required: true 
  },

  thumbnail: {
    type: String,
    default: ""
  },

  businessName: { 
    type: String, 
    required: true 
  },

  website: { 
    type: String 
  },

  whatsapp: { 
    type: String, 
    default: "919473549700"
  },

  // 📊 Analytics
  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  whatsappClicks: { 
    type: Number, 
    default: 0 
  },

  websiteClicks: { 
    type: Number, 
    default: 0 
  },

  // ⚙️ Status tracking
  status: {
    type: String,
    enum: ["processing", "ready", "failed"],
    default: "ready"
  },

  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }

});

module.exports = mongoose.model("Reel", ReelSchema);
