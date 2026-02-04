async function fetchAcademic_year(db) {
  const semester_collection = db.collection("qa_form");

  const result =  await semester_collection.aggregate([
  { $match: { academic_year: { $exists: true } } },
  { $project: { _id: 0, academic_year: 1 } },
  { $unwind: "$academic_year" }
]).toArray();

return result.map(item => item.academic_year);

}

module.exports = { fetchAcademic_year };
