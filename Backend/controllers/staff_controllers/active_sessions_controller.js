const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");

async function getActiveSessions(req, res) {
  try {
    const db = getDb();
    const sessionCollection = db.collection("qa_exam_sessions");
    const scheduleCollection = db.collection("qa_schedule");
    const studentCollection = db.collection("student");

    // Fetch all ACTIVE exam sessions
    const activeSessions = await sessionCollection
      .find({ status: "ACTIVE" })
      .toArray();

    if (!activeSessions || activeSessions.length === 0) {
      return res.status(200).json({
        success: true,
        sessions: [],
        message: "No active exam sessions"
      });
    }

    // Enrich sessions with student and schedule details
    const enrichedSessions = await Promise.all(
      activeSessions.map(async (session) => {
        try {
          // Get student details
          const student = await studentCollection.findOne(
            { registerno: session.registerno },
            { projection: { name: 1, department: 1, batch: 1, registerno: 1 } }
          );

          // Get schedule and exam details
          let scheduleDetails = {};
          if (session.scheduleId) {
            const schedule = await scheduleCollection.findOne({
              _id: ObjectId.isValid(session.scheduleId)
                ? new ObjectId(session.scheduleId)
                : session.scheduleId
            });

            if (schedule) {
              scheduleDetails = {
                examName: schedule.cie,
                examDate: schedule.validFrom,
                endsAt: schedule.validTill,
                totalDuration: schedule.duration
              };
            }
          }

          // Calculate stats
          const answeredCount = session.currentQuestionIndex

          return {
            _id: session._id,
            registerno: session.registerno,
            name: student?.name || "Unknown",
            department: student?.department || "N/A",
            batch: student?.batch || "N/A",
            status: session.status,
            isOnline: session.isOnline,
            startedAt: session.startedAt,
            endsAt: session.endsAt,
            lastSeenAt: session.lastSeenAt,
            totalQuestions: scheduleDetails.examName === "cie3" ? 100 : 50,
            answeredCount: answeredCount,
            violations: session.violations || {
              totalViolations: 0,
              tabs: 0,
              windowBlur: 0,
              copyPaste: 0,
              screenshot: 0
            },
            examName: scheduleDetails.examName,
          };
        } catch (error) {
          console.error(`Error enriching session for ${session.registerno}:`, error);
          return {
            _id: session._id,
            registerno: session.registerno,
            name: "Error",
            department: "N/A",
            batch: "N/A",
            status: session.status,
            startedAt: session.startedAt,
            endsAt: session.endsAt,
            totalQuestions: session.totalQuestions || 50,
            answeredCount: 0,
            violations: session.violations || { totalViolations: 0 }
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      sessions: enrichedSessions,
      totalActive: enrichedSessions.length,
      message: "Active sessions retrieved successfully"
    });

  } catch (error) {
    console.error("Get Active Sessions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

module.exports = { getActiveSessions };
