const { getDb } = require("../../config/db");
const { getStudentsByDeptbatch, getStudentsByBatch } = require("./getstudent_controller");

async function qa_form(req, res) {
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

async function getQaForm(req,res) {
  try {
    const db = getDb();

    const form_collection = db.collection("qa_form");
    const question_collection = db.collection("qa_question");
    const student_collection = db.collection("student");

const [formData] = await form_collection.aggregate([
      {
        $match: { type: "qa_details" }
      },
      {
        $project: {
          _id: 0,
          departments: "$data.departments",
          subjects: "$data.subjects"
        }
      }
    ]).toArray();

    const batchResult = await student_collection.aggregate([
      {
        $addFields: {
          startYear: {
            $toInt: {
              $arrayElemAt: [{ $split: ["$batch", "-"] }, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          maxYear: { $max: "$startYear" }
        }
      }
    ]).toArray();

    const maxYear = batchResult[0]?.maxYear;
    const duration = 4;
    const batch = [];

    if (maxYear) {
      for (let i = 3; i >= 0; i--) {
        const start = maxYear - i;
        const end = start + duration;
        batch.push(`${start}-${end}`);
      }
    }


    const subjects = await question_collection.aggregate([
      {
        $project: {
          _id: 0,
          subject_name: 1,
          topics: "$exam.topic"
        }
      }
    ]).toArray();

    res.status(200).json({
      batch,
      departments: formData?.departments || [],
      subjectList: formData?.subjects || [],
      subjects
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function qa_form_all_student(req, res) {
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


module.exports = { qa_form, getQaForm, qa_form_all_student };
