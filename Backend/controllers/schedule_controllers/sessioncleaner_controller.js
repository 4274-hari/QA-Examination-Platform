const { getDb } = require("../../config/db");
const { ResultStore } = require("../staff_controllers/result_excel_controller");

const SessionClean = async () => {
  try {
    const now = new Date();

    const db = getDb();

    const schedulesCol = db.collection("qa_schedule");
    const qaExamCol = db.collection("qa_exam");
    const sessionCol = db.collection("qa_exam_sessions");

    const schedules = await schedulesCol
      .find({
        status: { $in: ["active", "inactive"] },
        validTill: {
          $exists: true,
          $lt: now,
        },
      })
      .toArray();

    for (const schedule of schedules) {
      const validTill = new Date(schedule.validTill);

      await schedulesCol.updateOne(
        { _id: schedule._id },
        { $set: { status: "inactive" } }
      );

      const cleanupTime = new Date(validTill.getTime() + 5 * 60 * 1000);

      if (now >= cleanupTime ) {
        
        const studentExams = await qaExamCol.find(
          { scheduleId: schedule._id, isStudentExam: true },
          { projection: { registerno: 1 } }
        ).toArray();
        const legacyExam = studentExams.length
          ? null
          : await qaExamCol.findOne({ scheduleId: schedule._id }, { projection: { students: 1 } });
        const registerNumbers = studentExams.length
          ? studentExams.map((exam) => exam.registerno)
          : legacyExam?.students?.map((student) => student.registerno) || [];
        if (!registerNumbers.length) continue;

        const result = await sessionCol.deleteMany({
          scheduleId: schedule._id,
          registerno: { $in: registerNumbers },
        });

        await ResultStore();

        
      }
    }
  } catch (error) {
     console.error("[CRON] SessionClean failed:", error);
  }
};

module.exports = SessionClean;
