const {getDb} = require("../../config/db");

const deleteSchedules = async () => {
  try {

    const db = getDb();

    const collection = db.collection("qa_schedule");

    const examcollection = db.collection("qa_exam");
    
    const tenDaysAgo = new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000
    );

    const result = await collection.find({
      status:"inactive",
      createdAt: { $lte: tenDaysAgo }
    }) .toArray();

    const scheduleIds = result.map(s => s._id);

    await examcollection.deleteMany({
      scheduleId:{$in:scheduleIds}
    })

    await collection.deleteMany({
      _id: { $in: scheduleIds }
    })

    
  } catch (error) {
    console.error("[CRON] Schedule cleanup failed:", error);
  }
};

module.exports = deleteSchedules;
