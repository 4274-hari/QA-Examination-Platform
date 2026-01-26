const cors = require("cors");

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",           // dev frontend
      "https://aptitudevec.in",          // production frontend
      /^http:\/\/127\.0\.0\.1:\d+$/,    // ✅ Electron static server (any port)
      /^http:\/\/localhost:\d+$/         // ✅ Electron static server (any port)
    ];
    
    // Allow requests with no origin (like Electron, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      // RegExp pattern
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

module.exports = cors(corsOptions);