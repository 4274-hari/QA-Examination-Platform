const session = require("express-session");
const { MongoStore } = require("connect-mongo");

function sessionMiddleware() {
  return session({
    name: "qa.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 3 * 60 * 60
    }),

    cookie: {
      httpOnly: true,
      secure: false, 
      sameSite: "lax", 
      maxAge: 3 * 60 * 60 * 1000,
      path: '/' 
    },
    rolling: true, 
    proxy: true 
  });
}

module.exports = sessionMiddleware;