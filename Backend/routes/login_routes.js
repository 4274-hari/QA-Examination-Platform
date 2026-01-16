const express = require("express");
const {
  signup,
  staffLogin,
  studentLogin,
} = require("../controllers/login_controller");
const {
  getStudent,
} = require("../controllers/form_controllers/studentform_controller");
const router = express.Router();

/* ===========================
   AUTHENTICATION ROUTES
   =========================== */
router.post("/signup", signup);
router.post("/staff/login", staffLogin);
router.post("/student/login", studentLogin);

/* ===========================
   STUDENT FORM ROUTES
   =========================== */
router.get("/students", getStudent);

module.exports = router;
