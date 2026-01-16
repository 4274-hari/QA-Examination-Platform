const { getDb } = require("../../config/db");

async function pauseExamSession(req, res) {
  try {
    const db = getDb();
    const sessionCollection = db.collection("qa_exam_sessions");

    // 1️⃣ Validate body
    const { registerno } = req.body;

    if (!registerno) {
      return res.status(400).json({
        success: false,
        message: "Register number is required"
      });
    }

    // 2️⃣ Check if exam session exists
    const session = await sessionCollection.findOne({ registerno });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "No exam session found for this register number"
      });
    }

    // 3️⃣ If already paused (optional safeguard)
    if (session.status === "PAUSED" && session.isOnline === false) {
      return res.status(409).json({
        success: false,
        message: "Exam session is already paused"
      });
    }

    // 4️⃣ Update session
    const result = await sessionCollection.updateOne(
      { registerno },
      {
        $set: {
          status: "PAUSED",
          isOnline: false,
          updatedAt: new Date()
        }
      }
    );

    // 5️⃣ Validate update result
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found"
      });
    }

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to pause exam session"
      });
    }

    // 6️⃣ Success response
    return res.status(200).json({
      success: true,
      message: "Exam session paused successfully"
    });

  } catch (error) {
    console.error("Pause Exam Session Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {pauseExamSession};
