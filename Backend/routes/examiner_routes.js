const express = require('express');
const router = express.Router();
const { viewExamCode } = require('../controllers/code_controllers/code_view_controller')
const { storeExamSchedule, cancelExamSchedule } = require('../controllers/schedule_controllers/exam_schedule_controller');
const { allowRoles  } = require('../middlewares/role_access_middleware')
const {exportMarks} = require('../controllers/staff_controllers/result_excel_controller');
const {qa_form, getQaForm, qa_form_all_student} = require('../controllers/form_controllers/form_controller');
const {pauseExamSession} = require("../controllers/student_controllers/status_pause_controller");
const {uploadStudentExcel} = require('../controllers/staff_controllers/uploadStudentExcel');
const { uploadFile } = require("../controllers/question_controllers/question_store_controller");




router.post('/exam_schedule', allowRoles("admin"), storeExamSchedule);
router.post('/exam_schedule/cancel', allowRoles("admin"), cancelExamSchedule)
router.get('/exam_code_view', allowRoles("admin","staff"), viewExamCode);
router.get('/form', allowRoles("admin"), getQaForm )
router.post('/get_register_no',allowRoles("admin"),qa_form);
router.post("/get_all_register_no",allowRoles("admin"), qa_form_all_student);
router.post('/result',allowRoles('admin'),exportMarks);

//exam session pause for student 
router.post("/pause_exam", pauseExamSession);

//student insertion
router.post('/studentsupload',allowRoles("admin") ,uploadStudentExcel);

//Question upload
router.post("/excelupload", uploadFile);

module.exports = router;