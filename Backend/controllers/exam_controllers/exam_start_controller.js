const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

async function startExam(req, res) {
  try {
    const db = getDb();
    const sessionCollection = db.collection("qa_exam_sessions");
    const scheduleCollection = db.collection("qa_schedule");

    const { scheduleId, examId } = req.body;
    
    const user = req.session.user;

    if (!user || !user.registerno) {
      return res.status(401).json({
        success: false,
        message: "Session expired or not logged in"
      });
    }

    const { registerno } = user;

    if (!ObjectId.isValid(scheduleId) || !ObjectId.isValid(examId)) {
      return res.status(400).json({ success: false, message: "Invalid exam session details" });
    }

    // Verify schedule and exam exist
    const schedule = await scheduleCollection.findOne({ 
      _id: new ObjectId(scheduleId),
      status: "active"
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Exam schedule not found"
      });
    }

    const examCollection = db.collection("qa_exam");
    const examIdObject = new ObjectId(examId);
    const studentExam = await examCollection.findOne({
      _id: examIdObject,
      scheduleId: schedule._id,
      registerno,
      isStudentExam: true,
    });
    const legacyExam = studentExam ? null : await examCollection.findOne({
      _id: examIdObject,
      scheduleId: schedule._id,
      "students.registerno": registerno,
    });
    if (!studentExam && !legacyExam) {
      return res.status(403).json({ success: false, message: "Exam is not assigned to this student" });
    }

    // Check if session already exists
    const existingSession = await sessionCollection.findOne({
      scheduleId: new ObjectId(scheduleId),
      registerno
    });

    if (existingSession) {
      if (existingSession.status === "ACTIVE") {
        req.session.qaExamScheduleId = scheduleId;
        return res.status(200).json({
          success: true,
          message: "Exam session already active",
          sessionId: existingSession.sessionId
        });
      }

      if (existingSession.status === "PAUSED") {
        // Resume paused session
        await sessionCollection.updateOne(
          { _id: existingSession._id },
          {
            $set: {
              status: "ACTIVE",
              isOnline: true,
              lastSeenAt: new Date()
            }
          }
        );
        req.session.qaExamScheduleId = scheduleId;

        return res.status(200).json({
          success: true,
          message: "Exam session resumed",
          sessionId: existingSession.sessionId,
          violations: existingSession.violations
        });
      }

      // Cannot restart completed/terminated exams
      return res.status(403).json({
        success: false,
        message: `Cannot start exam. Status: ${existingSession.status}`
      });
    }

    // Create new session
    const now = new Date();
    const durationMinutes = schedule.duration;
    const sessionId = uuidv4();

    await sessionCollection.insertOne({
      sessionId,
      scheduleId: new ObjectId(scheduleId),
      examId: examIdObject,
      studentId: user.id,
      registerno,
      department: user.department,
      batch: user.batch,

      status: "ACTIVE",
      isOnline: true,
      
      currentQuestionIndex: 0,
      
      durationMinutes,
      startedAt: now,
      endsAt: new Date(now.getTime() + durationMinutes * 60 * 1000),
      
      lastSeenAt: now,
      
      violations: {
        fullscreenExit: 0,
        tabSwitch: 0
      },
      
      offline: {
        count: 0,
        totalOfflineSeconds: 0
      },
      
      createdAt: now,
      updatedAt: now
    });
    req.session.qaExamScheduleId = scheduleId;

    return res.status(201).json({
      success: true,
      message: "Exam session started successfully",
      sessionId,
      violations: {
        fullscreenExit: 0,
        tabSwitch: 0
      },
      endsAt: new Date(now.getTime() + durationMinutes * 60 * 1000)
    });

  } catch (error) {
    console.error("❌ start Exam ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start exam session"
    });
  }
}

module.exports = { startExam };
