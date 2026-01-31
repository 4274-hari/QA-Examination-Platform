const { getDb } = require("../../config/db");
const { fetchBatch } = require("../../services/get_batch.service");
const { fetchDepartment } = require("../../services/get_department.service");

async function getStudentform(req, res) {
  try {
    const db = getDb();
    
    const departments = await fetchDepartment(db);

   const batches = await fetchBatch(db);

   const s3link = "/static/template/uploadstudent.xlsx";


    res.json({
      departments,
      batches: batches,
      s3link
    }); 

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStudentform };
