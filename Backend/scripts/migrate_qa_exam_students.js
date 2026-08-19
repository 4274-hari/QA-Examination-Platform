/*
 * Safe, repeatable migration from legacy schedule-level qa_exam documents to
 * one qa_exam document per student. It never deletes legacy documents.
 *
 * Run from Backend:
 *   node scripts/migrate_qa_exam_students.js
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { buildStudentExam } = require("../services/qa_exam_service");
const { ensureQaExamIndexes } = require("../services/qa_exam_indexes");

async function migrate() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  try {
    const db = client.db(process.env.DB_NAME);
    const exams = db.collection("qa_exam");
    const schedules = db.collection("qa_schedule");

    await ensureQaExamIndexes(db);

    const duplicateSessions = await db.collection("qa_exam_sessions")
      .aggregate([
        { $group: { _id: { scheduleId: "$scheduleId", registerno: "$registerno" }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 20 },
      ])
      .toArray();

    if (duplicateSessions.length) {
      console.warn("Duplicate qa_exam_sessions found; review before adding a unique session index:");
      console.warn(JSON.stringify(duplicateSessions, null, 2));
    }

    let migratedStudents = 0;
    let legacyDocuments = 0;
    const cursor = exams.find({
      isStudentExam: { $ne: true },
      students: { $type: "array" },
    });

    for await (const legacyExam of cursor) {
      const schedule = await schedules.findOne({ _id: legacyExam.scheduleId });
      if (!schedule) {
        console.warn(`Skipping ${legacyExam._id}: schedule ${legacyExam.scheduleId} no longer exists`);
        continue;
      }

      const operations = legacyExam.students
        .filter((student) => student.registerno)
        .map((student) => {
          const document = {
            ...buildStudentExam(schedule, {
              ...student,
              createdAt: legacyExam.createdAt,
              generatedAt: legacyExam.generatedAt,
            }),
            migratedFrom: legacyExam._id,
            migratedAt: new Date(),
          };

          return {
            updateOne: {
              filter: {
                isStudentExam: true,
                scheduleId: legacyExam.scheduleId,
                registerno: student.registerno,
              },
              update: { $setOnInsert: document },
              upsert: true,
            },
          };
        });

      if (operations.length) {
        await exams.bulkWrite(operations, { ordered: false });
        migratedStudents += operations.length;
      }
      legacyDocuments += 1;
    }

    console.log(`Migration complete. Processed ${legacyDocuments} legacy documents and ${migratedStudents} student records.`);
    console.log("Legacy qa_exam documents were retained. Verify counts before archiving them.");

    if (!duplicateSessions.length) {
      const sessions = db.collection("qa_exam_sessions");
      await sessions.dropIndex("qa_exam_session_schedule_student").catch((error) => {
        if (error.codeName !== "IndexNotFound") throw error;
      });
      await sessions.createIndex(
        { scheduleId: 1, registerno: 1 },
        { name: "qa_exam_session_schedule_student_unique", unique: true }
      );
      console.log("Created unique qa_exam_sessions scheduleId + registerno index.");
    }
  } finally {
    await client.close();
  }
}

migrate().catch((error) => {
  console.error("QA exam migration failed:", error);
  process.exitCode = 1;
});
