
const { getDb } = require("../../config/db");

async function forceExit(req, res) {
  try {
    const { reason, registerno } = req.body;
    console.log(reason, registerno);

    if (!reason || !registerno) {
      return res.status(400).json({ message: "Missing reason or registerno" });
    }

    const db = getDb();

    const collection = db.collection("qa_exam_sessions");

    const student = await collection.findOne({
      registerno,
    });

    if (!student) {
      return res.status(400).json({ message: "Student record is not found" });
    }

    switch (reason) {
      case "Violation limit exceeded":
        await collection.updateOne(
          { _id: student._id },
          {
            $set: {
              status: "TERMINATED",
              terminatedReason: "SESSION_ABANDONED",
              isOnline:false,
              endedAt: new Date(),
            },
          }
        );
        return res.status(403).json({ message: "Your exam was terminated due to a violation of the exam guidelines." });

      case "Exam session is no longer active":
      case "Session verification error":
      case "HeartBeat error":
          await collection.updateOne(
          { _id: student._id },
          {
            $set: {
              status: "PAUSED",
              isOnline:false,
            },
          }
        );
        return res.status(401).json({ message: "Your session is not active.You need to relogin" });

      case "Time up":
         await collection.updateOne(
          { _id: student._id },
          {
            $set: {
              status: "COMPLETED",
              isOnline:false,
              endedAt: new Date(),
            },
          }
        );
        return res.status(200).json({ message: "Your exam time is up" });

      default:
        return res.status(400).json({ message: "Invalid reason provided" });
    }
  } catch (error) {
    console.error("Force Exit Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


module.exports = {forceExit}