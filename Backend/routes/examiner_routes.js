const express = require('express');
const router = express.Router();
const { viewExamCode } = require('../controllers/code_controllers/code_view_controller')
const { storeExamSchedule, cancelExamSchedule } = require('../controllers/schedule_controllers/exam_schedule_controller');
const { allowRoles  } = require('../middlewares/role_access_middleware')
const {exportMarks} = require('../controllers/staff_controllers/result_excel_controller');
const {qaForm, getQaForm, qaFormAllStudents} = require('../controllers/form_controllers/form_controller');
const {pauseExamSession} = require("../controllers/staff_controllers/status_pause_controller");
const {uploadStudentExcel} = require('../controllers/staff_controllers/uploadStudentExcel');
const { uploadQuestion, deleteQuestion,  getSubject } = require("../controllers/question_controllers/question_store_controller");
const { addSubject, deleteSubject, updateSubject } = require("../controllers/staff_controllers/form_handle_controller");
const { handleBatchStudent, addStudent } = require("../controllers/staff_controllers/student_handle_controller");

// ===========================
// EXAM SCHEDULE (ADMIN)
// ===========================
router.post("/exam-schedule", allowRoles("admin"), storeExamSchedule);
router.post("/exam-schedule/cancel", allowRoles("admin"), cancelExamSchedule);

// ===========================
// EXAM CODE
// ===========================
router.get("/exam-code", allowRoles("admin", "staff"), viewExamCode);

// ===========================
// QA FORMS (ADMIN)
// ===========================
router.get("/forms", allowRoles("admin"), getQaForm);
router.post("/forms/register-number", allowRoles("admin"), qaForm);
router.post("/forms/register-number/all", allowRoles("admin"), qaFormAllStudents);

// ===========================
// RESULTS (ADMIN)
// ===========================
router.post("/results/export", allowRoles("admin"), exportMarks);

// ===========================
// SUBJECT MANAGEMENT (ADMIN)
// ===========================
router.post("/subjects", allowRoles("admin"), addSubject);
router.put("/subjects", allowRoles("admin"), updateSubject);
router.delete("/subjects", allowRoles("admin"), deleteSubject);

// ===========================
// STUDENT MANAGEMENT (ADMIN)
// ===========================
router.post("/students/batch", allowRoles("admin"), handleBatchStudent);
router.post("/students", allowRoles("admin"), addStudent);
router.post("/students/upload", allowRoles("admin"), uploadStudentExcel);

// ===========================
// EXAM SESSION CONTROL
// ===========================
router.post("/exam/pause", pauseExamSession);


// ===========================
// QUESTIONS
// ===========================
router.post("/questions", uploadQuestion);
router.delete("/questions", deleteQuestion);
router.get("/questions/subjects", getSubject);

module.exports = router;