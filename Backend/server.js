const express = require("express");
const compression = require("compression");
require("dotenv").config();

const connectToDatabase = require("./config/db");
const backendroutes = require("./routes");

const corsMiddleware = require("./middlewares/cors");
const sessionMiddleware = require("./middlewares/session");

const app = express();
const port = process.env.PORT || 5000;

const session = require("express-session");
const {MongoStore} = require("connect-mongo");

// Required for secure cookies behind Nginx / AWS
app.set("trust proxy", 1);

// Middlewares
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(sessionMiddleware());


app.use(session({
  name: "qa.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 4 * 60 * 60
  }),

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 4 * 60 * 60 * 1000
  }
}));

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
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
