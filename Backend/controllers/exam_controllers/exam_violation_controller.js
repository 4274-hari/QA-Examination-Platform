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

  const violationlimit = scheduledoc.violation;


  const currentTotal =
    (session.violations.fullscreenExit || 0) +
    (session.violations.tabSwitch || 0);

  const total = currentTotal + 1;

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

  await sessionCol.updateOne(
    { _id: session._id },
    { $inc: { [`violations.${type}`]: 1 } }
  );

  const updatedSession = await sessionCol.findOne({ _id: session._id });

  res.json({ 
    success: true, 
    totalViolations: total, 
    fullscreenExit: updatedSession.violations.fullscreenExit,
    tabSwitch: updatedSession.violations.tabSwitch
  });
}

module.exports = { registerViolation }
