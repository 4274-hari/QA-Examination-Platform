const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");
const { findStudentExam, studentExamFilter } = require("../../services/qa_exam_service");

async function submitAnswer(req, res) {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { registerno } = req.session.user;
    const { question, choosedOption, questionIndex } = req.body;

    if (!choosedOption || typeof questionIndex !== "number" || !question) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const db = getDb();
    const examCol = db.collection("qa_exam");
    const sessionCol = db.collection("qa_exam_sessions");

    // 1️⃣ Get active session
    const sessionFilter = { registerno, status: "ACTIVE" };
    const activeScheduleId = req.session.qaExamScheduleId;
    if (activeScheduleId && ObjectId.isValid(activeScheduleId)) {
      sessionFilter.scheduleId = new ObjectId(activeScheduleId);
    }
    const session = await sessionCol.findOne(sessionFilter, { sort: { startedAt: -1 } });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "ACTIVE") {
      return res.status(403).json({ message: "Session not active" });
    }

    // 2️⃣ Prevent skipping questions
    if (session.currentQuestionIndex !== questionIndex) {

      // If client retries same request after success
      if (session.currentQuestionIndex > questionIndex) {

        const examRecord = await findStudentExam(examCol, session.scheduleId, registerno);
        if (!examRecord) {
          return res.status(404).json({ message: "Exam record not found" });
        }

        const student = examRecord.student;

        const q = student?.questions?.find(
          (q) => q.questionNumber === questionIndex + 1
        );

        if (q?.choosedOption) {
          return res.status(200).json({
            message: "Answer already processed",
          });
        }
      }

      return res.status(400).json({ message: "Invalid question sequence" });
    }

    // 3️⃣ Get correct option
    const examRecord = await findStudentExam(examCol, session.scheduleId, registerno);
    if (!examRecord) {
      return res.status(404).json({ message: "Exam record not found" });
    }
    const student = examRecord.student;

    const q = student?.questions?.find(
      (q) => q.questionNumber === questionIndex + 1
    );

    if (!q) {
      return res.status(404).json({ message: "Question not found" });
    }

    const isCorrect =
      String(q.correct_option).trim() === String(choosedOption).trim();

    // 4️⃣ Atomic update (prevents double answering)
    const result = examRecord.isLegacy
      ? await examCol.updateOne(
        { _id: examRecord.exam._id },
        { $set: {
          "students.$[stu].questions.$[ques].choosedOption": choosedOption,
          "students.$[stu].questions.$[ques].isCorrect": isCorrect,
        } },
        { arrayFilters: [
          { "stu.registerno": registerno },
          { "ques.questionNumber": questionIndex + 1, "ques.choosedOption": { $exists: false } },
        ] }
      )
      : await examCol.updateOne(
        {
          ...studentExamFilter(session.scheduleId, registerno),
          questions: { $elemMatch: { questionNumber: questionIndex + 1, choosedOption: { $exists: false } } },
        },
        { $set: {
          "questions.$.choosedOption": choosedOption,
          "questions.$.isCorrect": isCorrect,
        } }
      );

    // If no update → already answered
    if (result.modifiedCount === 0) {
      return res.status(200).json({
        message: "Answer already processed",
      });
    }

    // 5️⃣ Move session forward
    const sessionUpdate = await sessionCol.updateOne(
      {
        registerno,
        status: "ACTIVE",
        currentQuestionIndex: questionIndex,
      },
      {
        $set: {
          currentQuestionIndex: questionIndex + 1,
          lastSeenAt: new Date(),
        },
      }
    );

    if (sessionUpdate.modifiedCount === 0) {
      return res.status(409).json({
        message: "Session update failed",
      });
    }

    return res.status(200).json({
      message: "Answer submitted successfully",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

module.exports = { submitAnswer };
