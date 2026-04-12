const mongoose = require("mongoose");

const MusicSchema = new mongoose.Schema({
  name: String,
  url: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Music", MusicSchema);
