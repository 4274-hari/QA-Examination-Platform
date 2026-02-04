const {getDb} = require("../../config/db");
const { ResultStore } = require("../staff_controllers/result_excel_controller");

const deleteSchedules = async () => {
  try {

    const db = getDb();

    const collection = db.collection("qa_schedule");

    const examcollection = db.collection("qa_exam");
    
    const DayAgo = new Date(
      Date.now() - 1* 24 * 60 * 60 * 1000
    );

    
    const result = await collection.find({
      status: { $in: ["synced"]},
      createdAt: { $lte: DayAgo }
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
