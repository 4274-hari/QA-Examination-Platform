const { getDb } = require("../../config/db");

async function getStudent(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("student");
    
    const departments = await collection.aggregate([
      { $group: { _id: "$department" } },
      { $project: { _id: 0, department: "$_id" } }
    ]).toArray();

    const departmentArray = departments.map(d => d.department);

   const batches = await collection.distinct("batch");


    res.json({
      departments: departmentArray,
      batches: batches
    }); 

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStudent };
