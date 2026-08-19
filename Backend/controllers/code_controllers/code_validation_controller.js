const { getDb } = require("../../config/db");
const { findStudentExam } = require("../../services/qa_exam_service");

async function validateExamCode(req, res) {
  try {
    const db = getDb();
    const scheduleCollection = db.collection("qa_schedule");
    const examCollection = db.collection("qa_exam");
    const sessionCollection = db.collection("qa_exam_sessions");

    const { code } = req.body;
    const user = req.session.user;

    // 1. Validate session
    if (!user || !user.registerno || !user.department || !user.batch) {
      return res.status(401).json({
        success: false,
        message: "Session expired or not logged in"

      });
    }

    const { registerno, department, batch } = user;

    // 2. Validate input
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Access denied. Invalid request parameters."
      });
    }

    // 3. Find active schedule
    const schedule = await scheduleCollection.findOne({ 
      examCode: code, 
      status: "active" 
    });


    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Access denied. Invalid exam code."
      });
    }

    // 4. Check time window
    const now = Date.now();
const validFrom = new Date(schedule.validFrom).getTime();
const validTill = new Date(schedule.validTill).getTime();

if (now < validFrom || now > validTill) {
  return res.status(400).json({
    success: false,
    message: "The exam is not accessible at this time. Please try again during the scheduled time."
  });
}

    // 5. Get this student's exam document. New documents are indexed by
    // scheduleId + registerno; old nested records remain a read-only fallback.
    const examRecord = await findStudentExam(examCollection, schedule._id, registerno);
    if (!examRecord) {
      return res.status(404).json({
        success: false,
        message: "Exam details are unavailable. Please contact the administrator."
      });
    }
    const { exam, student: studentFound } = examRecord;

    // 6. Check student eligibility
    if (studentFound.department !== department || studentFound.batch !== batch) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to attend this exam."
      });
    }

    // 7. Check if already completed
    if (studentFound.isComplete) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You already completed this exam."
      });
    }

    // 8. Check existing session status
    const existingSession = await sessionCollection.findOne({
      scheduleId: schedule._id,
      registerno
    });

    if (existingSession) {
      // If session exists, check its status
      if (existingSession.status === "COMPLETED") {
        return res.status(403).json({
          success: false,
          message: "You have already completed this exam."
        });
      }

      if (existingSession.status === "TERMINATED") {
        return res.status(403).json({
          success: false,
          message: `Exam access terminated: ${existingSession.terminatedReason || "Violation detected"}`
        });
      }

      // If ACTIVE or PAUSED, allow resumption
      if (existingSession.status === "ACTIVE" || existingSession.status === "PAUSED") {
        const examType = schedule.cie || schedule.examType;
        const totalQuestions = studentFound.questions?.length;

        return res.status(200).json({
          success: true,
          message: "Resuming your exam session.",
          isResume: true,
          examDetails: {
            subject: exam.subject,
            questions: studentFound.questions || [],
            totalQuestions: totalQuestions,
            examType: examType,
            date: schedule.date,
            startTime: schedule.start,
            endTime: schedule.end,
            duration: schedule.duration,
            currentQuestionIndex: existingSession.currentQuestionIndex || 0,
            timeRemaining: Math.max(0, existingSession.endsAt - now) / 1000, // seconds
            scheduleId: schedule._id.toString(),
            examId: examRecord.isLegacy ? exam._id.toString() : studentFound._id.toString()
          }
        });
      }
    }

    // 9. Return questions for a new exam without answer fields.
    const questions = (studentFound.questions || []).map(({ question, A, B, C, D, E }) => ({
      question, A, B, C, D, E,
    }));

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this student"
      });
    }

    // 10. Return exam details (don't create session yet)
    // Calculate total questions based on exam type
    const examType = schedule.cie || schedule.examType;
    const totalQuestions = questions.length;

    return res.status(200).json({
      success: true,
      message: "Exam code validated successfully. You are eligible to take this exam.",
      isResume: false,
      name: studentFound.name,
      examDetails: {
        scheduleId: schedule._id.toString(),
        examId: examRecord.isLegacy ? exam._id.toString() : studentFound._id.toString(),
        subject: exam.subject,
        questions,
        totalQuestions: totalQuestions,
        examType: examType,
        date: schedule.date,
        startTime: schedule.start,
        endTime: schedule.end,
        duration: schedule.duration
      }
    });

  } catch (error) {
    console.error("❌ validateExamCode ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later."
    });
  }
}

module.exports = { validateExamCode };
