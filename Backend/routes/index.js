const express = require("express");
const router = express.Router();
const auth = require("../middlewares/Auth")

// QA Modules
const loginRoutes = require("./login_routes");
const examinerRoutes = require("./examiner_routes");
const studentRoutes = require("./student_routes");
const examRoutes = require("./exam_routes");

// Auth
router.use("/auth", loginRoutes);

// Examiner
router.use("/examiner", auth, examinerRoutes);

// Student
router.use("/student", auth, studentRoutes);

// Exam
router.use("/exam", auth, examRoutes);



module.exports = router;
