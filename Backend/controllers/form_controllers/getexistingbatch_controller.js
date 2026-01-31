const {getDb} = require('../../config/db');

async function existingBatch(req, res) {

    try{

    const db = getDb();

    const collection = db.collection("student");

    const result = await collection.aggregate([
      {
        $group: {
          _id: "$batch",
          departments: { $addToSet: "$department" }
        }
      },
      {
        $project: {
          _id: 0,
          batch: "$_id",
          departments: 1
        }
      },
      {
        $sort: { batch: -1 }
      }
    ]).toArray();
    res.status(200).json({ success: true, result, s3link: "hello"});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

}

module.exports = {existingBatch}