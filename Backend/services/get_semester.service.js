async function fetchSemester(db) {
  const semester_collection = db.collection("qa_form");

  const result =  await semester_collection.aggregate([
  { $match: { semester: { $exists: true } } },
  { $project: { _id: 0, semester: 1 } },
  { $unwind: "$semester" }
]).toArray();

return result.map(item => item.semester);

}

module.exports = { fetchSemester };
