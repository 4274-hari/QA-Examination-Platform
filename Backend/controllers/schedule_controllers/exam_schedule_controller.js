const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");
const {scheduleExamActivation} = require("../code_controllers/code_generator_controller");
const { createExamFromSchedule } = require("./exam_student_controller");


async function storeExamSchedule(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_schedule");
    
    

   const {
      batch,
      department,
      registerNo,
      cie: cieRoman,
      subject,
      topics,
      date,
      start,
      end,
      isRetest
    } = req.body;
  

    const cieMap = {
      I: "cie1",
      II: "cie2",
      III: "cie3"
    }

    const cie = cieMap[cieRoman]

const examDateStr = date; 
const todayStr = new Date().toISOString().split('T')[0];

if (examDateStr < todayStr) {
  return res.status(400).json({
    success: false,
    message: "Cannot schedule exam for past dates. Please select current or future date."
  });
}


    /* -----------------------------
       Validation
    ----------------------------- */

    if (!batch || !cie || !subject  || !date || !start || !end || !topics) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if (!department && (!registerNo || registerNo.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Either department or registerNo must be provided"
      });
    }
// normalizer
    function timeToMinutes(timeStr) {
  let [time, period] = timeStr.trim().split(" ");
  let [hour, minute] = time.split(":").map(Number);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

// calculate duration
function calculateDuration(start, end) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  return endMinutes - startMinutes; // duration in minutes
}

  // call durationcalculate
   const duration = calculateDuration(start, end);

    /* -----------------------------
       Build schedule document
    ----------------------------- */

    const scheduleDoc = {
      batch,
      department: department || null,
      registerNo: registerNo || null,

      cie,
      subject,

      isRetest,

      topics,

      date,
      start,
      end,
      duration,

      examCode: null,
      validFrom: null,
      validTill: null,
      status: "scheduled",

      createdAt: new Date()
    };

    /* -----------------------------
   Conflict check
----------------------------- */

const conflictQuery = {
  date,
  batch,
  status: { $ne: "inactive" },
  $or: [
    department ? { department } : null,
    registerNo && registerNo.length
      ? { registerNo: { $in: registerNo } }
      : null
  ].filter(Boolean)
};

const existingSchedule = await collection.findOne(conflictQuery);

if (existingSchedule) {
  return res.status(409).json({
    success: false,
    message:
      "An exam is already scheduled for this department or register number on the same date. Please delete the previous schedule and try again.",
    existingScheduleId: existingSchedule._id
  });
}


    /* -----------------------------
       Insert schedule
    ----------------------------- */

    const result = await collection.insertOne(scheduleDoc);

    /* -----------------------------
       Schedule one-time activation
    ----------------------------- */

    await createExamFromSchedule(result.insertedId);

    scheduleExamActivation({
      ...scheduleDoc,
      _id: result.insertedId,batch, department, cie, subject, topics, date
    });

    /* -----------------------------
       Response
    ----------------------------- */

    return res.status(201).json({
      success: true,
      message: "Exam schedule saved. Code will activate 10 minutes before exam.",
      scheduleId: result.insertedId
    });

  } catch (error) {
    console.error("❌ Error storing exam schedule:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

async function cancelExamSchedule(req, res) {
  try {
    const db = getDb();

    const collection = db.collection("qa_schedule");

    const examCollection = db.collection("qa_exam");

    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "scheduleId is required"
      });
    }

    const scheduleObjectId = new ObjectId(scheduleId);

    const exam = await collection.findOne({
      _id: scheduleObjectId
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam schedule not found"
      });
    }

    await collection.deleteOne(
      { _id: scheduleObjectId }
    );

    await examCollection.deleteOne(
      { scheduleId: scheduleObjectId }
    );

    return res.status(200).json({
      success: true,
      message: "Exam schedule cancelled successfully"
    });

  } catch (error) {
    console.error("❌ Cancel exam error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}


module.exports = {
  storeExamSchedule,
  cancelExamSchedule
};
