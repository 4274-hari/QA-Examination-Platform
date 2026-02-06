const express = require("express");
const {
  signup,
  staffLogin,
  studentLogin,
} = require("../controllers/login_controller");
const {
  getStudentform,
} = require("../controllers/form_controllers/studentform_controller");
const { forgotpassword, resetPassword } = require("../controllers/staff_controllers/forgot_password_controller");
const router = express.Router();

/* ===========================
   AUTHENTICATION ROUTES
   =========================== */
router.post("/signup", signup);
router.post("/staff/login", staffLogin);
router.post("/student/login", studentLogin);

/* ===========================
   PASSWORD RESET ROUTES
   =========================== */

   router.post('/forgot_password',forgotpassword);
   router.post('/reset_password',resetPassword);

/* ===========================
   STUDENT FORM ROUTES
   =========================== */
router.get("/students", getStudentform);

module.exports = router;
