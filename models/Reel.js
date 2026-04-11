const mongoose = require("mongoose");

const ReelSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },

  // 📍 Location (City + GPS)
  city: { 
    type: String, 
    default: "Unknown"
  },
  lat: { 
    type: Number, 
    default: null 
  },
  lng: { 
    type: Number, 
    default: null 
  },

  // 🎬 Reel Data
  videoUrl: { 
    type: String, 
    required: true 
  },

  businessName: { 
    type: String, 
    required: true 
  },

  website: { 
    type: String 
  },

  // 📞 WhatsApp
  whatsapp: { 
    type: String, 
    default: "919473549700" // fallback
  },

  // 📊 Analytics
  whatsappClicks: { 
    type: Number, 
    default: 0 
  },
  websiteClicks: { 
    type: Number, 
    default: 0 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Reel", ReelSchema);
