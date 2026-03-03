const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");

/**
 * Create qa_exam doc and attach students for a schedule
 */
async function createExamFromSchedule(scheduleId) {
  const db = getDb();

  const scheduleCollection = db.collection("qa_schedule");
  const studentCollection = db.collection("student");
  const examCollection = db.collection("qa_exam");

  /* -----------------------------
     Get schedule
  ----------------------------- */

  const schedule = await scheduleCollection.findOne({
    _id: new ObjectId(scheduleId)
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  /* -----------------------------
     Fetch students based on schedule
  ----------------------------- */
  
  let students = [];

  if (schedule.department && schedule.batch) {

    const departmentFilter = Array.isArray(schedule.department)
      ? { $in: schedule.department }
      : schedule.department;

    students = await studentCollection.find({
      department: departmentFilter,
      batch: schedule.batch
    }).toArray();
  }

  // Case 2: Register-number based
  if (schedule.registerNo && schedule.registerNo.length > 0) {
    students = await studentCollection.find({
      registerno: { $in: schedule.registerNo }
    }).toArray();
  }

  if (students.length === 0) {
    await scheduleCollection.deleteOne({ _id: scheduleId });
    throw new Error("No students found for this schedule");
  }

   const registerNumbers = students.map(s => s.registerno);

  await scheduleCollection.updateOne(
    { _id: schedule._id },
    {
      $set: {
        registerNo: registerNumbers
      }
    }
  );

  /* -----------------------------
     Prepare student snapshot
  ----------------------------- */

  const studentList = students.map(s => ({
    studentId: s._id,
    registerno: s.registerno,
    name: s.name,
    department: s.department,
    batch: s.batch,
    violation:0,
    section: s.section
  }));

  /* -----------------------------
     Create qa_exam document
  ----------------------------- */

  const examDoc = {
    scheduleId: schedule._id,

    isRetest:schedule.isRetest,

    isArrear:schedule.isArrear,

    regulation : schedule.regulation,

    academic_year: schedule.academic_year,

    semester: schedule.semester,

    subject: schedule.subject,
    cie: schedule.cie,
    batch: schedule.batch,

    students: studentList,

    date:schedule.date,

    createdAt: new Date()
  };

  await examCollection.insertOne(examDoc);


  return {
    examId: examDoc._id,
    totalStudents: studentList.length
  };
}

module.exports = {
  createExamFromSchedule
};
