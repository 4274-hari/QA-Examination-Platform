const { getDb } = require("../../config/db");

async function markOffline(req, res) {
  console.log("OFFLINE");
  
  const db = getDb();
  const sessionCol = db.collection("qa_exam_sessions");

  const { registerno } = req.session.user;
  const session = req.examSession;

  console.log(`📴 Marking ${registerno} offline...`); 

  const result = await sessionCol.updateOne(
    { _id: session._id, status: "ACTIVE" },
    {
      $set: {
        status: "PAUSED",
        "offline.lastDisconnectedAt": new Date(),
        isOnline: false,
        lastSeenAt: new Date()
      },
      $inc: { "offline.count": 1 }
    }
  );

  console.log(`✅ Update result:`, result.modifiedCount); // ← Log result

  // Even if update fails, return success (beacon might retry)
  res.status(200).json({ success: true });
}

async function resumeSession(req, res) {
  const db = getDb();
  const sessionCol = db.collection("qa_exam_sessions");

  const session = req.examSession;

  if (!session || !["PAUSED"].includes(session.status)) {
    return res.status(403).json({
      status: session?.status,
      reason: session?.terminatedReason
    });
  }

  await sessionCol.updateOne(
    { _id: session._id },
    {
      $set: {
        status: "ACTIVE",
        isOnline: true,
        lastSeenAt: new Date()
      }
    }
  );

  res.json({ success: true });
}

async function getResumeData(req, res) {
  const db = getDb();
  const examCol = db.collection("qa_exam");
  const sessionCol = db.collection("qa_exam_sessions");

  const { registerno } = req.session.user;
  const session = req.examSession;

  if (!session) {
    return res.status(404).json({ status: "NO_SESSION" });
  }

  if (session.status !== "ACTIVE") {
    return res.status(403).json({
      status: session.status,
      reason: session.terminatedReason
    });
  }

  const { findStudentExam } = require("../../services/qa_exam_service");
  const examRecord = await findStudentExam(examCol, session.scheduleId, registerno);
  if (!examRecord) return res.status(404).json({ status: "NO_EXAM" });
  const student = examRecord.student;

  // 🔥 ONLY questions already ATTEMPTED / SERVED
  const answeredQuestions = student.questions
    .slice(0, session.currentQuestionIndex + 1)
    .map(q => ({
      question: q.question,
      A: q.A,
      B: q.B,
      C: q.C,
      D: q.D,
      selected: q.choosedOption || null
    }));

  res.json({
    currentQuestionIndex: session.currentQuestionIndex,
    answeredQuestions
  });
}

async function getResumeQuestions(req, res) {
  const db = getDb();
  const examCol = db.collection("qa_exam");
  const sessionCol = db.collection("qa_exam_sessions");

  const { registerno } = req.session.user;
  const session = req.examSession;

  if (!session || session.status !== "ACTIVE") {
    return res.status(403).json({ message: "Session not active" });
  }

  const { findStudentExam: findStudentExamForResume } = require("../../services/qa_exam_service");
  const examRecord = await findStudentExamForResume(examCol, session.scheduleId, registerno);
  if (!examRecord) return res.status(404).json({ message: "Exam not found" });
  const { exam, student } = examRecord;

  res.json({
    subject: exam.subject,
    questions: student.questions.map(q => ({
      question: q.question,
      A: q.A,
      B: q.B,
      C: q.C,
      D: q.D
    }))
  });
}

module.exports = { markOffline, resumeSession, getResumeData, getResumeQuestions }
