async function fetchBatch(db) {
  const batch_collection = db.collection("student");

  return await batch_collection.distinct("batch", {
      batch: { $exists: true, $ne: "" }
    });
}

module.exports = { fetchBatch };
