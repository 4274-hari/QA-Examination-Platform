const express = require('express');
const router = express.Router();

//QA
const login = require('./login_routes');
const qa_examiner = require('./examiner_routes');
const qa_student = require('./student_routes');
const qa_exam = require('./exam_routes')
const qa_question_paper = require('./questionstore_routes')

//QA
router.use('',login);
router.use('',qa_exam)
router.use('',qa_examiner);
router.use('',qa_student);
router.use('',qa_question_paper)

module.exports = router;
