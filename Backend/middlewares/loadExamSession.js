const { getDb } = require("../config/db");
const { ObjectId } = require("mongodb");

module.exports = async function loadExamSession(req, res, next) {
  try {
    const db = getDb();
    const sessionCol = db.collection("qa_exam_sessions");

    const { registerno } = req.session?.user || {};
    if (!registerno) {
      return res.status(401).json({ status: "UNAUTHORIZED", message: "Session expired or not logged in" });
    }

    const scheduleId = req.session.qaExamScheduleId;
    const filter = { registerno };
    if (scheduleId && ObjectId.isValid(scheduleId)) {
      filter.scheduleId = new ObjectId(scheduleId);
    }

    const session = await sessionCol.findOne(filter, { sort: { startedAt: -1 } });

    if (!session) {
      return res.status(404).json({
        status: "NO_SESSION",
        message: "Exam session not found"
      });
    }

    req.examSession = session;
    next();
  } catch (err) {
    // console.error("loadExamSession error:", err);
    res.status(500).json({ message: "Session load failed" });
  }
};
