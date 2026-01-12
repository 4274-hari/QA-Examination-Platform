const { getDb } = require("../../config/db");

async function Handlebatchstudent(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("student");

    const { batch, delete_batch, delete_student } = req.body;

    const hasBatchDelete =
      Array.isArray(delete_batch) && delete_batch.length > 0;

    const hasStudentDelete =
      Array.isArray(delete_student) && delete_student.length > 0;

    if (!hasBatchDelete && !hasStudentDelete) {
      return res.status(400).json({
        message: "No delete_batch or delete_student data provided",
      });
    }

    let studentResult = null;
    let batchResult = null;

    if (hasStudentDelete) {
      if (!batch) {
        return res.status(400).json({
          message: "Please provide batch for deleting students",
        });
      }

      studentResult = await collection.deleteMany({
        registerno: { $in: delete_student },
        batch: batch,
      });
    }

    if (hasBatchDelete) {
      batchResult = await collection.deleteMany({
        batch: { $in: delete_batch },
      });
    }

    if (hasStudentDelete && hasBatchDelete) {
      return res.status(200).json({
        message: "Students and batches deleted successfully",
        studentsDeleted: studentResult.deletedCount,
        batchesDeleted: batchResult.deletedCount,
      });
    }

    if (hasStudentDelete) {
      if (studentResult.deletedCount === 0) {
        return res.status(400).json({ message: "Student not found" });
      }

      return res.status(200).json({
        message: "Students deleted successfully",
        deletedCount: studentResult.deletedCount,
      });
    }

    if (hasBatchDelete) {
      if (batchResult.deletedCount === 0) {
        return res.status(400).json({ message: "Batch not found" });
      }

      return res.status(200).json({
        message: "Batch deleted successfully",
        deletedCount: batchResult.deletedCount,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function addStudent(req, res) {
  try {
    const db = getDb();

    const collection = db.collection("student");

    const { name, registerno, password, department, batch } = req.body;

    if (!name || !registerno || !password || !department || !batch) {
      return res
        .status(400)
        .json({ message: "Please Provide a required fields" });
    }

    const datePassword = /^\d{2}-\d{2}-\d{4}$/;

    if (!datePassword.test(password)) {
      return res.status(400).json({
        message: "Password must be in DD-MM-YYYY format",
      });
    }

    const student = await collection.findOne({
      registerno: registerno,
      batch: batch,
    });

    if (student) {
      return res.status(400).json({ message: "Student is Already Exist" });
    }

    await collection.insertOne({
      name,
      registerno,
      password,
      department: department.toUpperCase(),
      batch,
      createdAt: new Date(),
    });

    return res
      .status(201)
      .json({ message: `A Student ${name} is inserted succesfully` });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { Handlebatchstudent, addStudent };
