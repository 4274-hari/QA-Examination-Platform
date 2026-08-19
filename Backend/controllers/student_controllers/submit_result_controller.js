const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");
const { findStudentExam, studentExamFilter } = require("../../services/qa_exam_service");


async function qaResult(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_exam");
    const sessionCollection = db.collection("qa_exam_sessions");

    if (!req.session.user) {
      return res.status(401).json({ message: "Session expired / not logged in" });
    }

    const { registerno } = req.session.user;
    
    const { scheduleId } = req.body;  

    if (!scheduleId) {
      return res.status(400).json({
        message: "scheduleId is required"
      });
    }

    if (!ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid scheduleId" });
    }
    const scheduleObjectId = new ObjectId(scheduleId);

    // 🎯 Find EXACT exam
    const examRecord = await findStudentExam(collection, scheduleObjectId, registerno);
    if (!examRecord) {
      return res.status(404).json({
        message: "Exam record not found for this schedule"
      });
    }

    const { exam: examDoc, student } = examRecord;

    if (!student) {
      return res.status(404).json({
        message: "Student not found in this exam"
      });
    }

    // ✅ Calculate marks
    const totalMarks = student.questions.filter(
      q => q.isCorrect === true
    ).length;

    // 🔒 Mark completion ONLY for this exam
    const completedAt = new Date();
    if (examRecord.isLegacy) {
      await collection.updateOne(
        { scheduleId: scheduleObjectId, "students.registerno": registerno },
        { $set: { "students.$.isComplete": true, "students.$.completedAt": completedAt } }
      );
    } else {
      await collection.updateOne(
        studentExamFilter(scheduleObjectId, registerno),
        { $set: { isComplete: true, completedAt } }
      );
    }

    // 🧹 Update ONLY this exam session
    await sessionCollection.updateOne(
      { scheduleId: scheduleObjectId, registerno },
      {
        $set: {
          status: "RESULT"
        }
      }
    );

    const sessionDoc = await sessionCollection.findOne(
      { scheduleId: scheduleObjectId, registerno },
      {
        projection: {
          violations: 1,  // add extra details if needed
        }
      }
    );

    res.json({
      scheduleId,
      registerno,
      name: student.name,
      department: student.department,
      batch: student.batch,
      subject: examDoc.subject,
      cie: examDoc.cie,
      totalMarks,
      violations: sessionDoc?.violations || {
        fullscreenExit: 0,
        tabSwitch: 0
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { qaResult };
