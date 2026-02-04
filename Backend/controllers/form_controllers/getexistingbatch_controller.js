const {getDb} = require('../../config/db');
require("dotenv").config();

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

    
   const s3link = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/qa-exam/template/QA_Student_Database_Format_Sample.xls`;

   return  res.status(200).json({ success: true, result, s3link});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

}


async function getStudentsdetails(req, res) {
  try {
    const { department, batch } = req.body;

    if (!department || !batch) {
      return res.status(400).json({
        message: "Department and batch are required"
      });
    }

    const db = getDb();

    const collection = db.collection("student");

    const result = await collection
      .find(
        { batch, department },        
        { projection: { _id:0, password: 0, email:0, phone:0 } } 
      )
      .toArray();

    if (!result) {
      return res.status(404).json({
        message: "No students found"
      });
    }

    res.status(200).json({ success: true, result });

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
}


module.exports = {existingBatch, getStudentsdetails}