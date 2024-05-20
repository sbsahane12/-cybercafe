// app.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const { config } = require("dotenv");

config(); // Load environment variables from .env

const app = express();

// Database connection
async function connectToDB() {
  await mongoose.connect(process.env.DB_URL);
  console.log("MongoDB connected");
}
connectToDB().catch(console.error);

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
app.use(methodOverride("_method"));

// Routes
app.use("/user", require("./routes/user"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
