const express = require("express");

const router = express.Router();

const { submitAnswer } = require("../controllers/student_controllers/next_answer_controller");
const { qaresult } = require("../controllers/student_controllers/submit_result_controller");
const { validateExamCode } = require("../controllers/code_controllers/code_validation_controller");

router.post("/next", submitAnswer);
router.post("/studentresult", qaresult);
router.post("/validate-exam-code", validateExamCode);

module.exports = router;
