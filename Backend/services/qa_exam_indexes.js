async function ensureQaExamIndexes(db) {
  await Promise.all([
    db.collection("qa_exam").createIndex(
      { scheduleId: 1, registerno: 1 },
      {
        name: "qa_exam_schedule_student_unique",
        unique: true,
        // Legacy schedule documents do not have registerno. Keeping this
        // partial index makes the rollout safe until they are archived.
        partialFilterExpression: { isStudentExam: true },
      }
    ),
    db.collection("qa_exam_sessions").createIndex(
      { status: 1 },
      { name: "qa_exam_session_status" }
    ),
  ]);

  // A migrated database has a unique version of this index, while a database
  // with historic duplicate sessions has the non-unique version. Either is a
  // valid index for reads, so never overwrite it at application startup.
  const sessionCollection = db.collection("qa_exam_sessions");
  const sessionIndexes = await sessionCollection.indexes();
  const hasScheduleStudentIndex = sessionIndexes.some((index) =>
    index.key?.scheduleId === 1 && index.key?.registerno === 1
  );
  if (!hasScheduleStudentIndex) {
    await sessionCollection.createIndex(
      { scheduleId: 1, registerno: 1 },
      { name: "qa_exam_session_schedule_student" }
    );
  }
}

module.exports = { ensureQaExamIndexes };
