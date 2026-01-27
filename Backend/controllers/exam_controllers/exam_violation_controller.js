const { getDb } = require("../../config/db");

async function registerViolation(req, res) {
  const db = getDb();
  const sessionCol = db.collection("qa_exam_sessions");
  const schedulecol = db.collection("qa_schedule");
  const examCol = db.collection("qa_exam"); 
  const { type } = req.body;
  const { registerno } = req.session.user;

  const session = await sessionCol.findOne({ registerno });

  if (!session) return res.sendStatus(404);

  const scheduledoc  = await schedulecol.findOne({
    _id:session.scheduleId});

  const violationlimit = scheduledoc.violation;


  const currentTotal =
    (session.violations.fullscreenExit || 0) +
    (session.violations.tabSwitch || 0);

  const total = currentTotal + 1;

  if (total >= violationlimit) {
    await sessionCol.updateOne(
      { registerno },
      {
        $set: {
          status: "TERMINATED",
          terminatedReason: "VIOLATION_LIMIT_EXCEEDED",
          endedAt: new Date()
        }
      }
    );
    await examCol.updateOne(
      { 
        _id: session.examId,
        "students.registerno": registerno 
      },
      {
        $set:  {
          "students.$.violations": total
        }
      }
    );
    return res.status(403).json({
      terminated: true,
      totalViolations: total
    });
  }

  await sessionCol.updateOne(
    { registerno },
    { $inc: { [`violations.${type}`]: 1 } }
  );

  const updatedSession = await sessionCol.findOne({ registerno });

  res.json({ 
    success: true, 
    totalViolations: total, 
    fullscreenExit: updatedSession.violations.fullscreenExit,
    tabSwitch: updatedSession.violations.tabSwitch
  });
}

module.exports = { registerViolation }