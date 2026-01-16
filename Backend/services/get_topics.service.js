async function fetchSubjectsWithTopics(db) {
  const question_collection = db.collection("qa_question");

  return await question_collection.aggregate([
    {
      $project: {
        _id: 0,
        subject_name: 1,
        topics: "$exam.topic"
      }
    }
  ]).toArray();
}

module.exports = { fetchSubjectsWithTopics };
