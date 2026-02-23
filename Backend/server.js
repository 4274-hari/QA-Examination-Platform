const express = require("express");
const compression = require("compression");
const path = require('path')
require("dotenv").config();

const connectToDatabase = require("./config/db");
const backendroutes = require("./routes");

const corsMiddleware = require("./middlewares/cors");
const sessionMiddleware = require("./middlewares/session");

const app = express();
const port = process.env.PORT || 5000;

// Required for secure cookies behind Nginx / AWS
app.set("trust proxy", 1);

// Middlewares
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(sessionMiddleware());

 

// Keep session alive
app.use((req, res, next) => {
  if (req.session?.user) {
    req.session.touch();
  }
  next();
});

// Session check
app.get("/api/main-backend/check-session", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ session: "expired" });
  }
  res.json({ session: "active", user: req.session.user });
});

// Routes
app.use("/api/main-backend", backendroutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// Start server
async function startServer() {

   // Only run cron in PM2 instance 0
  if (process.env.NODE_APP_INSTANCE === "0") {
    console.log("Starting CRON in instance 0");
    require("./middlewares/cron");
  }
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
