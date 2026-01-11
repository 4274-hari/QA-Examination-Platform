const express = require('express');

const router = express.Router();

const {submitAnswer} = require('../controllers/next_answer_controller');
const {qaresult} = require('../controllers/submit_result_controller');
const { validateExamCode } = require("../controllers/code_controllers/code_validation_controller");
const {uploadStudentExcel} = require('../controllers/uploadStudentExcel');
const { allowRoles } = require('../middlewares/role_access_middleware');


router.post('/next',submitAnswer);
router.post('/studentresult',qaresult);
router.post("/validate-exam-code", validateExamCode);

//student insertion
router.post('/studentsupload',allowRoles("admin") ,uploadStudentExcel);




module.exports = router;