const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.Root,
  api_key: process.env.A239883837765114,
  api_secret: process.env.LcWWM2ivCEv6UgizWcGVoKnfffA
});

module.exports = cloudinary;



