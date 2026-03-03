const { getDb } = require("../../config/db");

async function submitAnswer(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_exam");
    const sessionCol = db.collection("qa_exam_sessions");

    const { question, choosedOption, questionIndex } = req.body;

    if (!question || !choosedOption) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { registerno } = req.session.user;

    const session = await sessionCol.findOne({ registerno });

    if (!session) return res.sendStatus(404);

    if (session.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Session not active",
      });
    }

    const sessionUpdate = await sessionCol.updateOne(
      { registerno, status: "ACTIVE", currentQuestionIndex: questionIndex },
      {
        $set: {
          currentQuestionIndex: questionIndex + 1, // move forward
          lastSeenAt: new Date(),
        },
      },
    );

    if (sessionUpdate.matchedCount === 0) {
      // Get latest session
      const latestSession = await sessionCol.findOne({ registerno });

      // If session already moved ahead, verify question was actually answered
      if (latestSession && latestSession.currentQuestionIndex > questionIndex) {
        // Re-fetch exam document
        const doc = await collection.findOne({
          scheduleId: session.scheduleId,
          "students.registerno": registerno,
        });

        if (!doc) {
          return res.status(404).json({ message: "Exam record not found" });
        }

        const student = doc.students.find((s) => s.registerno === registerno);

        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        const q = student.questions.find(
          (q) => q.questionNumber === questionIndex + 1,
        );

        // ✅ Check if already answered
        if (q && q.choosedOption) {
          return res.status(200).json({
            message: "Answer already processed",
          });
        }
      }

      return res.status(400).json({ message: "Invalid question sequence" });
    }
    const doc = await collection.findOne({
      scheduleId: session.scheduleId,
      "students.registerno": registerno,
    });

    if (!doc) {
      return res.status(404).json({ message: "Exam record not found" });
    }

    const student = doc.students.find((s) => s.registerno === registerno);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const q = student.questions.find(
      (q) =>
        q.questionNumber === questionIndex + 1 &&
        q.question.trim() === question.trim(),
    );

    if (!q) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (q.choosedOption) {
      return res.status(409).json({ message: "Question already answered" });
    }

    const isCorrect = q.correct_option.trim() === choosedOption.trim();

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          "students.$[stu].questions.$[ques].choosedOption": choosedOption,
          "students.$[stu].questions.$[ques].isCorrect": isCorrect,
        },
      },
      {
        arrayFilters: [
          { "stu.registerno": registerno },
          { "ques.question": q.question },
        ],
      },
    );

    return res.status(200).json({
      message: "Answer updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { submitAnswer };
