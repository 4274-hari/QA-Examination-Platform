const crypto = require("crypto");
const { getDb } = require("../../config/db");
const { generateExam } = require("../question_controllers/question_assigner_controller");

/* ---------------------------------------------------
   Time utilities
--------------------------------------------------- */
function toDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    throw new Error("Invalid time format: " + timeStr);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const FRONTEND_TZ_OFFSET_MINUTES = 330;

  const utcTime =
    Date.UTC(year, month - 1, day, hour, minute) -
    FRONTEND_TZ_OFFSET_MINUTES * 60 * 1000;

  return new Date(utcTime);
}
/* ---------------------------------------------------
   Exam code generator (6 chars A–Z 0–9)
--------------------------------------------------- */

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateExamCode() {
  const bytes = crypto.randomBytes(6);
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }

  return code;
}

/* ---------------------------------------------------
   Validity window
--------------------------------------------------- */

function computeValidity(date, start, end) {
  const startTime = toDateTime(date, start);
  const endTime = toDateTime(date, end);

  return {
    validFrom: new Date(startTime.getTime() - 10 * 60 * 1000),
    validTill: endTime
  };
}

/**
 * Activate exam and generate unique code
 */
async function activateExam() {
  const db = getDb();
  const collection = db.collection("qa_schedule");
  const now = new Date();

  /* -------------------------------
     1️⃣ Activate Scheduled Exams
  --------------------------------*/
  const scheduledExams = await collection.find({
    status: "scheduled"
  }).toArray();

  for (const exam of scheduledExams) {
    const { validFrom, validTill } = computeValidity(
      exam.date,
      exam.start,
      exam.end
    );

    if (validFrom <= now) {
      let examCode;

      // Ensure unique exam code
      do {
        examCode = generateExamCode();
      } while (await collection.findOne({ examCode }));

      await collection.updateOne(
        { _id: exam._id, status: "scheduled" }, // prevent race condition
        {
          $set: {
            examCode,
            validFrom,
            validTill,
            status: "active"
          }
        }
      );

      await generateExam(
        exam.batch,
        exam.department,
        exam.registerNo,
        exam.cie,
        exam.subject,
        exam.topics,
        exam.date
      );

      console.log(`Exam ${exam._id} activated`);
    }
  }

  /* -------------------------------
     2️⃣ Expire Finished Exams
  --------------------------------*/
  await collection.updateMany(
    {
      status: "active",
      validTill: { $lt: now }
    },
    {
      $set: { status: "expired" }
    }
  );
}

module.exports = {activateExam};
