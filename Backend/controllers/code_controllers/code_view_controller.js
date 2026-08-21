const { getDb } = require("../../config/db");

async function viewExamCode(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_schedule");  

    const exams = await collection
      .find({ status: { $in: ["scheduled", "active"] } })
      .sort({ start: 1 })
      .toArray();

    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No exams scheduled"
      });
    }

    const response = exams.map(exam => ({
      scheduleId: exam._id,
      regulation: exam.regulation,
      semester: exam.semester,
      category: exam.isArrear ? "Arrear" : exam.isRetest ? "Re-Test" : "Regular",

      academic_year: exam.academic_year,
      batch: exam.batch,
      department: exam.department,
      totalStudents : exam.registerNo ? exam.registerNo.length : 0,
      cie: exam.cie.toUpperCase(),
      subject: exam.subject,
      date:exam.date,
      start: exam.start,
      end: exam.end,
      examCode: exam.examCode,
      status: exam.status
    }));

    return res.status(200).json({
      success: true,
      count: response.length,
      exams: response
    });

  } catch (error) {
    console.error("❌ Error fetching Schedule exams details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function viewExamCodeHistory(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_schedule");

    const exams = await collection
      .find({ status: { $in: ["synced", "inactive"] } })
      .sort({ start: 1 })
      .toArray();

    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No exam history found"
      });
    }

    const response = exams.map(exam => ({
      scheduleId: exam._id,
      regulation: exam.regulation,
      category: exam.isArrear ? "Arrear" : exam.isRetest ? "Re-Test" : "Regular",
      semester: exam.semester,
      academic_year: exam.academic_year,
      batch: exam.batch,
      department: exam.department,
      cie: exam.cie.toUpperCase(),
      subject: exam.subject,
      date: exam.date,
      start: exam.start,
      end: exam.end,
      examCode: exam.examCode,
      status: exam.status
    }));

    return res.status(200).json({
      success: true,
      count: response.length,
      exams: response
    });

  } catch (error) {
    console.error("❌ Error fetching exam history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {
  viewExamCode,
  viewExamCodeHistory
};
