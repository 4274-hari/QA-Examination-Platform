const express = require("express");
const compression = require('compression')
const backendroutes = require("./routes");
const connectToDatabase = require('./config/db');
const session = require("express-session");
const {MongoStore} = require("connect-mongo");
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(compression());

// Session
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

app.use((req, res, next) => {
  if (req.session?.user) {
    req.session.touch();
  }
  next();
});


app.get('/api/main-backend/check-session', (req, res) => {
  const sessionExists = !! req.session;
  res.json({ 
    session: sessionExists ?  'exists' : 'not exists'
  });
});

// main route to index
app.use('/api/main-backend', backendroutes);


// initiating server
async function startServer() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
