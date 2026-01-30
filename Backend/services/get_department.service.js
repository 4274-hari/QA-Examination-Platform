async function fetchDepartment(db) {
  const department_collection = db.collection("student");

  return await department_collection.distinct("department", {
      department: { $exists: true, $ne: "" }
    });
}

module.exports = { fetchDepartment };
