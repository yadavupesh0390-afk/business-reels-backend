const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ROOT ROUTE
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// 🔥 MongoDB Atlas
mongoose.connect("YOUR_MONGODB_ATLAS_URL")
  .then(()=>console.log("MongoDB Connected ✅"))
  .catch(err=>console.log(err));

// ROUTES
app.use("/auth", require("./routes/auth"));
app.use("/reels", require("./routes/reels"));

// PORT FIX
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
