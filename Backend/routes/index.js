const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth")

// QA Modules
const loginRoutes = require("./login_routes");
const examinerRoutes = require("./examiner_routes");
const studentRoutes = require("./student_routes");
const examRoutes = require("./exam_routes");
const updateRoutes = require('./updates')

// Auth
router.use("/auth", loginRoutes);

// Examiner
router.use("/examiner", requireAuth, examinerRoutes);

// Student
router.use("/student", requireAuth, studentRoutes);

// Exam
router.use("/exam", examRoutes);

// Updates
router.use('/updates', updateRoutes)


module.exports = router;
