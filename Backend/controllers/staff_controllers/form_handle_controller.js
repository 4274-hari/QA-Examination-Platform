const { getDb } = require("../../config/db");

exports.addSubject = async (req, res) => {
  try {
    const { data } = req.body;

    const db = getDb();
    const collection = db.collection("qa_form");

    const exists = await collection.findOne({
      type: "qa_details",
      "data.subjects.name": data.name
    });

    if (exists) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    await collection.updateOne(
      { type: "qa_details" },
      { $push: { "data.subjects": data } }
    );

    res.status(201).json({
      message: "Subject added successfully",
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const {name,data} = req.body;

    const db = getDb();
    const collection = db.collection("qa_form");

    const result = await collection.updateOne(
      { type: "qa_details", "data.subjects.name": name },
      {
        $set: {
          "data.subjects.$": data
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({
      message: "Subject updated successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { name } = req.body;

    const db = getDb();
    const collection = db.collection("qa_form");

    const result = await collection.updateOne(
      { type: "qa_details" },
      {
        $pull: {
          "data.subjects": { name }
        }
      }
    );

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
