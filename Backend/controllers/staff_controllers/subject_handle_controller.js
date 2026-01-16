const { getDb } = require("../../config/db");

exports.addSubject = async (req, res) => {
  try {
    let { subject_name } = req.body;

     if (!subject_name) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    subject_name = subject_name.trim().toUpperCase();


    const db = getDb();
    const collection = db.collection("qa_question");

    const exists = await collection.findOne({
      subject_name: subject_name
    });

    if (exists) {
      return res.status(400).json({ message: "Subject already exists" });
    }

   const result = await collection.insertOne({ subject_name });

    res.status(201).json({
      message: "Subject added successfully",
      data: result.insertedId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    let { subject_name } = req.body;

       if (!subject_name) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    subject_name = subject_name.trim().toUpperCase();


    const db = getDb();
    const collection = db.collection("qa_question");

    
    const result = await collection.deleteOne({ subject_name });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({
      message: "Subject deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
