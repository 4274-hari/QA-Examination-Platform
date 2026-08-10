const { getDb } = require("../../config/db");

async function registerViolation(req, res) {
  const db = getDb();
  const sessionCol = db.collection("qa_exam_sessions");
  const schedulecol = db.collection("qa_schedule");
  const examCol = db.collection("qa_exam"); 
  const { type } = req.body;
  const { registerno } = req.session.user;

  const session = req.examSession;

  if (!session) return res.sendStatus(404);

  const scheduledoc  = await schedulecol.findOne({
    _id:session.scheduleId});

  const violationlimit = Number(scheduledoc?.violation);
  const allowedViolationTypes = new Set([
    "fullscreenExit",
    "tabSwitch",
    "windowBlur",
    "pagehide",
    "printScreen",
    "screenshot"
  ]);

  if (!allowedViolationTypes.has(type) || !Number.isFinite(violationlimit) || violationlimit <= 0) {
    return res.status(400).json({ message: "Invalid violation request" });
  }

  // Increment first, then calculate the total from the persisted document. This
  // prevents two near-simultaneous browser/Electron events from using stale data.
  const updateResult = await sessionCol.findOneAndUpdate(
    { _id: session._id, status: "ACTIVE" },
    { $inc: { [`violations.${type}`]: 1 } },
    { returnDocument: "after" }
  );

  const updatedSession = updateResult;
  if (!updatedSession) {
    return res.status(409).json({
      status: session.status,
      message: "Exam session is no longer active"
    });
  }

  const total = Object.values(updatedSession.violations || {}).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0
  );

  const { findStudentExam, studentExamFilter } = require("../../services/qa_exam_service");
  const examRecord = await findStudentExam(examCol, session.scheduleId, registerno);
  if (!examRecord) return res.sendStatus(404);
  if (examRecord.isLegacy) {
    await examCol.updateOne(
      { _id: examRecord.exam._id },
      { $set: { "students.$[student].violation": total } },
      { arrayFilters: [{ "student.registerno": registerno }] }
    );
  } else {
    await examCol.updateOne(studentExamFilter(session.scheduleId, registerno), { $set: { violation: total } });
  }

  if (total >= violationlimit) {
    await sessionCol.updateOne(
      { _id: session._id },
      {
        $set: {
          status: "TERMINATED",
          terminatedReason: "VIOLATION_LIMIT_EXCEEDED",
          endedAt: new Date()
        }
      }
    );
    
    return res.status(403).json({
      terminated: true,
      totalViolations: total
    });
  }

  res.json({ 
    success: true, 
    totalViolations: total, 
    fullscreenExit: updatedSession.violations.fullscreenExit,
    tabSwitch: updatedSession.violations.tabSwitch
  });
}

module.exports = { registerViolation }
