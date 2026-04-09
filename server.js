// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // 🔥 Load environment variables

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 ROOT route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// 🔹 MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.error("DB Error ❌:", err));

// 🔹 Routes
app.use("/auth", require("./routes/auth"));   // Login/Register
app.use("/reels", require("./routes/reels")); // Reels API

// 🔹 PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
