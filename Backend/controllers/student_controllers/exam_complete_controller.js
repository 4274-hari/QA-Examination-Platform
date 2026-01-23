const { ObjectId } = require("mongodb");
const { getDb } = require("../../config/db");

async function closeResult(req, res) {
  try {
    const db = getDb();
    const sessionCollection = db.collection("qa_exam_sessions");

    if (!req.session.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const { scheduleId } = req.body;
    const { registerno } = req.session.user;

    if (!scheduleId) {
      return res.status(400).json({ message: "scheduleId is required" });
    }

    if (!ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid scheduleId" });
    }


    const result = await sessionCollection.updateOne(
      {
        scheduleId: new ObjectId(scheduleId),
        registerno,
        status: { $ne: "COMPLETED" }
      },
      {
        $set: {
          status: "COMPLETED",
          isOnline: false,
          completedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Session not found or already completed" });
    }

    res.json({
      message: "Status updated to COMPLETED and isOnline set to false"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { closeResult };