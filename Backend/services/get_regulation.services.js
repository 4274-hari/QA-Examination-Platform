async function fetchRegulation(db) {
  const semester_collection = db.collection("qa_form");

  const result =  await semester_collection.aggregate([
  { $match: { regulation: { $exists: true } } },
  { $project: { _id: 0, regulation: 1 } },
  { $unwind: "$regulation" }
]).toArray();

return result.map(item => item.regulation);

}

module.exports = { fetchRegulation };
