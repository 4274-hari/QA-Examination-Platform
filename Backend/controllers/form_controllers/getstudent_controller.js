const { getDb } = require("../../config/db");

async function getStudentsByDeptbatch(department, batch) {
  if (!department || !batch) {
    throw new Error("Department and batch are required");
  }

  const db = getDb();
  const collection = db.collection("student");

  const students = await collection
    .find(
      {
        department,
        batch: batch
      },
      {
        projection: { registerno: 1, name: 1, _id: 0 }
      }
    )
    .toArray();


  return students.map(s => ({ registerno: s.registerno, name: s.name }));
}


async function getStudentsByBatch(batch) {
  if (!batch) {
    throw new Error("Batch are required");
  }

  const db = getDb();
  const collection = db.collection("student");

  const students = await collection
    .find(
      {
        batch: batch
      },
      {
        projection: { registerno: 1, name: 1, _id: 0 }
      }
    )
    .toArray();


  return students.map(s => ({ registerno: s.registerno, name: s.name }));
}


module.exports = { getStudentsByDeptbatch, getStudentsByBatch };
