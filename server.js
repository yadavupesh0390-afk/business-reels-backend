const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/businessReels");

app.use("/auth", require("./routes/auth"));
app.use("/reels", require("./routes/reels"));

app.listen(5000, () => console.log("Server running"));
