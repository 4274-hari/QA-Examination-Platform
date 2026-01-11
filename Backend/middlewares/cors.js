const cors = require("cors");

const corsOptions = {
  origin: [
    "http://localhost:5173",      // dev frontend
    "https://aptitudevec.in"      // production frontend
  ],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

module.exports = cors(corsOptions);
