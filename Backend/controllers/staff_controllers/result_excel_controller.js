const ExcelJS = require('exceljs');
const {ObjectId} = require('mongodb');
const {PutObjectCommand} = require('@aws-sdk/client-s3');
const {s3, bucketName} = require('../../config/s3.js');
const {getDb} = require('../../config/db.js');

async function exportMarks(scheduleId) {
  const db = getDb();

  const schedule = await db.collection("qa_schedule").findOne({
    _id: new ObjectId(scheduleId)
  });
  if (!schedule) throw new Error("Schedule not found");

  const exam = await db.collection("qa_exam").findOne({
    scheduleId: new ObjectId(scheduleId)
  });
  if (!exam || !exam.students?.length)
    throw new Error("No exam data");

  const subjectTopicMap = {};

  for (const student of exam.students) {
    for (const q of student.questions || []) {
      if (!q.subject || !q.topic) continue;

      if (!subjectTopicMap[q.subject]) {
        subjectTopicMap[q.subject] = new Set();
      }

      subjectTopicMap[q.subject].add(q.topic);
    }
  }

  // Preserve insertion order
  const subjects = Object.keys(subjectTopicMap);
  const subjectTopics = {};
  subjects.forEach(
    s => (subjectTopics[s] = Array.from(subjectTopicMap[s]))
  );


  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("CIE MARKS");

  const cieMap = {
    cie1 : "CIE I",
    cie2 : "CIE II",
    cie3 : "CIE III",
  }

  const meta = [
    ["Regulation", schedule.regulation],
    ["Academic Year", schedule.academic_year],
    ["Batch", schedule.batch],
    ["CIE", cieMap[schedule.cie]],
    ["Semester", schedule.semester],
    ["Department", schedule.department],
    ["Subject Name", subjects.join(" / ")],
    ["Date", schedule.date],
  ];

  meta.forEach((row, i) => {
    sheet.getCell(`A${i + 1}`).value = row[0];
    sheet.getCell(`B${i + 1}`).value = row[1];
  });

  const headerRowIndex = meta.length + 2;

  const headers = [
    "S No",
    "Reg No",
    "NAME (BLOCK LETTERS)",
    "Branch"
  ];

  subjects.forEach(subject => {
    subjectTopics[subject].forEach(topic => headers.push(topic));
    headers.push(`${subject} Total`);
  });

  headers.push("Grand Total");

  sheet.getRow(headerRowIndex).values = headers;
  sheet.getRow(headerRowIndex).font = { bold: true };

  let rowIndex = headerRowIndex + 1;
  let sNo = 1;

  for (const student of exam.students) {
    const subjectMarks = {};
    subjects.forEach(s => {
      subjectMarks[s] = Object.fromEntries(
        subjectTopics[s].map(t => [t, 0])
      );
    });

    for (const q of student.questions || []) {
      const isCorrect = q.isCorrect === true; 
      if (!isCorrect) continue;

      if (
        subjectMarks[q.subject] &&
        subjectMarks[q.subject][q.topic] !== undefined
      ) {
        subjectMarks[q.subject][q.topic]++;
      }
    }

    const row = [
      sNo++,
      student.registerno,
      student.name,
      student.department
    ];

    let grandTotal = 0;

    subjects.forEach(subject => {
      const topicValues = Object.values(subjectMarks[subject]);
      const subjectTotal = topicValues.reduce((a, b) => a + b, 0);

      row.push(...topicValues);
      row.push(subjectTotal);

      grandTotal += subjectTotal;
    });

    row.push(grandTotal);

    sheet.getRow(rowIndex).values = row;
    rowIndex++;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const key = `qa-exam/result/${schedule.department
    .replace(/\s+/g, "_")}/${schedule.cie}/${schedule._id}.xlsx`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    })
  );

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

async function ResultStore() {
  try {
    const db = getDb();

    const scheduleCollection = db.collection("qa_schedule");
    const resultCollection = db.collection("qa_result");

    const schedules = await scheduleCollection.find({
      status: "inactive"
    }).toArray();

    if (!schedules.length) {
      console.log("[CRON] No schedules found to sync");
      return;
    }

    const resultDocs = [];

    for (const schedule of schedules) {
      try {
        
        // Check duplicate BEFORE heavy export
        const exists = await resultCollection.findOne({
          scheduleId: schedule._id
        });

        if (exists) {
          console.log(`[CRON] Skipping duplicate schedule ${schedule._id}`);
          continue;
        }

        const excel_link = await exportMarks(
          schedule._id
        );

        resultDocs.push({
          scheduleId: schedule._id,
          regulation: schedule.regulation,
          academic_year: schedule.academic_year,
          batch: schedule.batch,
          semester: schedule.semester,
          department: schedule.department ?? null,
          registerNo: schedule.registerNo ?? [],
          cie: schedule.cie,
          subject: schedule.subject ?? [],
          isRetest: Boolean(schedule.isRetest),
          isArrear: Boolean(schedule.isArrear),
          date: schedule.date,
          excel_link,
          createdAt: new Date()
        });

        console.log(`[CRON] Synced schedule ${schedule._id}`);

      } catch (scheduleErr) {
        console.error(
          `[CRON] Failed schedule ${schedule._id}:`,
          scheduleErr.message
        );

        // Optional: mark failed
        await scheduleCollection.updateOne(
          { _id: schedule._id },
          { $set: { status: "failed", error: scheduleErr.message } }
        );
      }
    }

    if (resultDocs.length) {
      await resultCollection.insertMany(resultDocs);
      console.log(`[CRON] Inserted ${resultDocs.length} result docs`);
    }

    console.log("[CRON] QA result sync completed");

  } catch (err) {
    console.error("[CRON] Fatal error in ResultStoreCron:", err);
  }
}


async function Excelgenerator(req, res) {
  try {
    const {
      regulation,
      academic_year,
      batch,
      cie,
      exam_type, 
      department,
      semester
    } = req.body;

    if (!regulation || !batch || !academic_year) {
      return res.status(400).json({
        message: "Regulation, Batch and Academic year are required"
      });
    }

    const db = getDb();
    const resultCollection = db.collection("qa_result");

    const filter = {
      regulation,
      academic_year,
      batch
    };

    if (cie) filter.cie = cie;
    if (department) filter.department = department;
    if (semester) filter.semester = semester;

    if (exam_type === "Arrear") {
      filter.isArrear = true;
    } else if (exam_type === "Retest") {
      filter.isRetest = true;
    } else if (exam_type === "Regular") {
      filter.isArrear = false;
      filter.isRetest = false;
    }

    const results = await resultCollection
      .find(filter)
      .project({ _id: 0, excel_link: 1 })
      .toArray();

    if (!results.length) {
      return res.status(404).json({
        message: "No results found"
      });
    }

    // Extract only excel links
    const excelLinks = results.map(r => r.excel_link);

    return res.json({
      message: "Excel links fetched successfully",
      count: excelLinks.length,
      excel_link: excelLinks
    });

  } catch (err) {
    console.error("Fetch excel link error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
}


module.exports = { exportMarks, ResultStore, Excelgenerator };