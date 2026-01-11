const express = require('express');
const {signup , stafflogin, studentlogin} = require('../controllers/login_controller');
const { getStudent } = require('../controllers/form_controllers/studentform_controller');
const router = express.Router();

router.post('/signup',signup);
router.post('/stafflogin', stafflogin);
router.post('/studentlogin',studentlogin);
router.get('/qastudentform',getStudent)

module.exports = router;