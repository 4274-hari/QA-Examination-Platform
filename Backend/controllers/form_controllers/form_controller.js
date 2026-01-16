const { getDb } = require("../../config/db");
const { getStudentsByDeptbatch, getStudentsByBatch } = require("./getstudent_controller");

async function qaForm(req, res) {
  try {
    const { department, batch } = req.body;

    if (!department || !batch) {
      return res.status(400).json({
        message: "Department and batch are required"
      });
    }

    // ✅ fetch students
    const registerNumbers = await getStudentsByDeptbatch(department.toUpperCase(), batch);

    if (registerNumbers.length === 0) {
      return res.status(404).json({
        message: "No students found"
      });
    }

    res.status(200).json({
      students: registerNumbers,
      count: registerNumbers.length,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
}

const { fetchSubjectsWithTopics } = require('../../services/get_topics.service');

async function getQaForm(req, res) {
  try {
    const db = getDb();

    const form_collection = db.collection("qa_form");
    const student_collection = db.collection("student");

    // 🔹 Form subjects
    const [formData] = await form_collection.aggregate([
      { $match: { type: "qa_details" } },
      {
        $project: {
          _id: 0,
          subjects: "$data.subjects"
        }
      }
    ]).toArray();

    // 🔹 UNIQUE batches
    const batch = await student_collection.distinct("batch", {
      batch: { $exists: true, $ne: "" }
    });

    // 🔹 UNIQUE departments
    const departments = await student_collection.distinct("department", {
      department: { $exists: true, $ne: "" }
    });

    // 🔹 Reused logic
    const subjects = await fetchSubjectsWithTopics(db);

    res.status(200).json({
      batch,
      departments,
      subjectList: formData?.subjects || [],
      subjects
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function  qaFormAllStudents(req, res) {
  try {
    const { batch } = req.body;

    if (!batch) {
      return res.status(400).json({
        message: "Batch is required"
      });
    }

    // ✅ fetch all students by batch (no department filter)
    const registerNumbers = await getStudentsByBatch(batch);

    if (registerNumbers.length === 0) {
      return res.status(404).json({
        message: "No students found for this batch"
      });
    }

    res.status(200).json({
      students: registerNumbers,
      count: registerNumbers.length,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
}


module.exports = { qaForm, getQaForm, qaFormAllStudents };
