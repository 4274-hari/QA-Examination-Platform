const express = require("express");

const router = express.Router();

const { submitAnswer } = require("../controllers/student_controllers/next_answer_controller");
const { qaResult } = require("../controllers/student_controllers/submit_result_controller");
const { validateExamCode } = require("../controllers/code_controllers/code_validation_controller");
const { closeResult } = require("../controllers/student_controllers/exam_complete_controller");

// Submit next answer
router.post("/answers/next", submitAnswer);

// Submit final exam result
router.post("/results", qaResult);

// Complete status
router.post("/completed",closeResult)

// Validate exam code
router.post("/exam-code/validate", validateExamCode);

module.exports = router;
