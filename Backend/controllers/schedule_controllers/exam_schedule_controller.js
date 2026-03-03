const { getDb } = require("../../config/db");
const { ObjectId } = require("mongodb");
const { createExamFromSchedule } = require("./exam_student_controller");

// normalizer for exam time duration
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

async function storeExamSchedule(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_schedule");
   const {
    regulation,
    academic_year,
      batch,
      semester,
      department,
      registerNo,
      cie: cieRoman,
      subject,
      topics,
      date,
      start,
      end,
      violation,
      isRetest,
      isArrear
    } = req.body;
    
    // call durationcalculate
    const duration = calculateDuration(start, end);

    const cieMap = {
      "CIE I": "cie1",
      "CIE II": "cie2",
      "CIE III": "cie3"
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

    if (!batch || !cie || !subject  || !date || !start || !end || !topics || !violation || !academic_year || !semester || !regulation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if(violation <= 0){
      return res.status(400).json({
        success: false,
        message: "Violation must be greater than 0"
      });
    }

     // department must be array if provided
    if (department && !Array.isArray(department)) {
      return res.status(400).json({
        success: false,
        message: "Department must be an array"
      });
    }

    if (!department && (!registerNo || registerNo.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Either department or registerNo must be provided"
      });
    }

    /* -----------------------------
       Build schedule document
    ----------------------------- */

    const scheduleDoc = (dept) => ({
      regulation:regulation.toUpperCase(),
      academic_year,
      batch,
      semester,
      department: dept || null,
      registerNo: registerNo || null,

      cie,
      subject: Array.isArray(subject) && subject.length === 1 && subject[0] === "QA"
        ? ["QA", "CS"]
        : subject,

      isRetest,

      isArrear,

      topics,

      date,
      start,
      end,
      
      violation,
      
      duration,


      examCode: null,
      validFrom: null,
      validTill: null,
      status: "scheduled",

      createdAt: new Date()
    });

    let insertedIds = [];

    /* -----------------------------
    Conflict check
    ----------------------------- */

      if (department && department.length > 0) {

      for (let dept of department) {

        // Conflict check per department
        const conflict = await collection.findOne({
          date,
          batch,
          department: dept,
          status: { $ne: "inactive" }
        });

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: `Exam already scheduled for ${dept} on this date.`,
          });
        }

        const buildscheduleDoc = scheduleDoc(dept);

        const result = await collection.insertOne(buildscheduleDoc);

        insertedIds.push(result.insertedId);

        await createExamFromSchedule(result.insertedId);
      }

    } 
    else if (registerNo && registerNo.length > 0) {

      const conflict = await collection.findOne({
        date,
        batch,
        registerNo: { $in: registerNo },
        status: { $ne: "inactive" }
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Exam already scheduled for given register numbers."
        });
      }

       const buildscheduleDoc = scheduleDoc(null);

      const result = await collection.insertOne(buildscheduleDoc);

      insertedIds.push(result.insertedId);

      await createExamFromSchedule(result.insertedId);

    }

    /* -----------------------------
       Response
    ----------------------------- */

    return res.status(201).json({
      success: true,
      message: "Exam schedule saved. Code will activate 10 minutes before exam."
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
