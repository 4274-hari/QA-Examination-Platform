const { getDb } = require("../../config/db");
const { fetchBatch } = require("../../services/get_batch.service");
const { fetchDepartment } = require("../../services/get_department.service");

async function getStudentform(req, res) {
  try {
    const db = getDb();
    
    const departments = await fetchDepartment(db);

   const batches = await fetchBatch(db);

    return res.status(200).json({
      departments,
      batches: batches
    }); 

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStudentform };
