const express = require('express');
const { heartbeat, ping } = require('../controllers/exam_controllers/exam_heartbeat_controller');
const { getRemainingTime } = require('../controllers/exam_controllers/exam_time_controller');
const { markOffline, resumeSession, getResumeData, getResumeQuestions } = require('../controllers/exam_controllers/exam_offline_controller');
const { registerViolation } = require('../controllers/exam_controllers/exam_violation_controller');
const { getSessionStatus } = require('../controllers/exam_controllers/exam_status_controller');
const requireAuth = require('../middlewares/requireAuth');
const loadExamSession = require('../middlewares/loadExamSession');
const requireActiveSession = require('../middlewares/requireActiveSession');
const { startExam } = require('../controllers/exam_controllers/exam_start_controller');
const router = express.Router();

// router.use("/qa/session", requireAuth, loadExamSession);

router.get("/qa/session/ping", ping);
router.post("/qa/session/start-exam", requireAuth, startExam);
router.post("/qa/session/heartbeat", loadExamSession, requireActiveSession, heartbeat);
router.post("/qa/session/offline", requireAuth,loadExamSession, markOffline); 
router.post("/qa/session/resume", requireAuth,loadExamSession, resumeSession); 
router.post("/qa/session/violation",loadExamSession, requireActiveSession, registerViolation);
router.get('/qa/session/status', requireAuth,loadExamSession,requireActiveSession, getSessionStatus);
router.get('/qa/session/time', loadExamSession,requireActiveSession, getRemainingTime);
router.get("/qa/session/resume-data", requireAuth, loadExamSession, getResumeData);
router.get("/qa/session/questions", requireAuth, loadExamSession, getResumeQuestions);

module.exports = router