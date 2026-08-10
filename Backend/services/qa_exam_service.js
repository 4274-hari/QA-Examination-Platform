const { ObjectId } = require("mongodb");

const STUDENT_EXAM_FILTER = { isStudentExam: true };

function toObjectId(value) {
  return value instanceof ObjectId ? value : new ObjectId(value);
}

function studentExamFilter(scheduleId, registerno) {
  return {
    ...STUDENT_EXAM_FILTER,
    scheduleId: toObjectId(scheduleId),
    registerno,
  };
}

async function findStudentExam(examCollection, scheduleId, registerno) {
  const filter = studentExamFilter(scheduleId, registerno);
  const exam = await examCollection.findOne(filter);

  if (exam) {
    return { exam, student: exam, isLegacy: false };
  }

  // Temporary compatibility for records created before the one-document-per-
  // student schema. The migration creates the new documents without deleting
  // these records, so an interrupted deployment cannot block an active exam.
  const legacyExam = await examCollection.findOne({
    scheduleId: toObjectId(scheduleId),
    "students.registerno": registerno,
  });

  if (!legacyExam) return null;

  return {
    exam: legacyExam,
    student: legacyExam.students.find((student) => student.registerno === registerno),
    isLegacy: true,
  };
}

function buildStudentExam(schedule, student) {
  return {
    isStudentExam: true,
    schemaVersion: 2,
    scheduleId: schedule._id,
    studentId: student.studentId || student._id,
    registerno: student.registerno,
    name: student.name,
    department: student.department,
    batch: student.batch,
    section: student.section,
    violation: student.violation || 0,
    isComplete: Boolean(student.isComplete),
    completedAt: student.completedAt,
    questions: student.questions || [],
    isRetest: schedule.isRetest,
    isArrear: schedule.isArrear,
    regulation: schedule.regulation,
    academic_year: schedule.academic_year,
    semester: schedule.semester,
    subject: schedule.subject,
    cie: schedule.cie,
    date: schedule.date,
    createdAt: student.createdAt || new Date(),
    generatedAt: student.generatedAt,
  };
}

module.exports = {
  STUDENT_EXAM_FILTER,
  toObjectId,
  studentExamFilter,
  findStudentExam,
  buildStudentExam,
};
