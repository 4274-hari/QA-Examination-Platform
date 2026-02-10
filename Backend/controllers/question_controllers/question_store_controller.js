const { s3, bucketName } = require("../../config/s3");
const { getDb } = require("../../config/db");
const Busboy = require("busboy");
const path = require("path");
const { ListObjectsCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
require("dotenv").config();

/* ================= CONSTANTS ================= */
const BASE_PATH = "static/xlsx/qa/question/";
const COLLECTION_NAME = "qa_question";
const SUPPORTED_EXTENSIONS = [".xlsx", ".xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* ================= HELPERS ================= */

const getTypePath = (filetype) => `${BASE_PATH}${filetype.toUpperCase()}/`;

const isSupportedFileType = (filename) =>
  SUPPORTED_EXTENSIONS.includes(path.extname(filename).toLowerCase());

const pick = (obj, keys, def = "") => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return obj[k].toString().trim();
    }
  }
  return def;
};

const normalizeText = (t = "") =>
  t.toLowerCase().trim().replace(/\s+/g, " ");

function normalizeDifficultyLevel(d) {
  const n = parseInt(d);
  return !isNaN(n) && n >= 1 && n <= 3 ? n : null;
}

/* ================= S3 ================= */

async function getSafeFilename(typePath, filename) {
  const base = path.basename(filename, path.extname(filename));
  let name = `${base}.xlsx`, i = 2;

  const { Contents = [] } = await s3.send(
    new ListObjectsCommand({ Bucket: bucketName, Prefix: typePath })
  );

  while (Contents.some(f => f.Key === `${typePath}${name}`)) {
    name = `${base}(${i++}).xlsx`;
  }
  return name;
}

/* ================= XLS CONVERSION ================= */

async function convertXlsToXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const out = new ExcelJS.Workbook();

  wb.SheetNames.forEach(name => {
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
    const sheet = out.addWorksheet(name);
    data.forEach((r, i) => sheet.getRow(i + 1).values = r);
  });

  return out.xlsx.writeBuffer();
}

/* ================= EXCEL PARSING ================= */

const extractPlainText = (v) => {
  if (v == null) return "";
  if (v === 0) return "0";
  if (typeof v === "boolean") return String(v);
  if (v.richText) return v.richText.map(t => t.text || "").join("");
  if (v.result !== undefined) return String(v.result);
  if (v.hyperlink && v.text) return v.text;
  return String(v).trim();
};

function isDuplicateQuestion(a, b) {
  if (normalizeText(a.question) !== normalizeText(b.question)) return false;
  return ["A","B","C","D","E"].every(
    k => normalizeText(a[k] || "") === normalizeText(b[k] || "")
  );
}

function isValidQuestionSheet(ws) {
  let q = false, o = false;
  ws.eachRow((r, i) => {
    if (i > 20) return;
    r.eachCell(c => {
      const v = extractPlainText(c.value).toLowerCase();
      if (v === "question") q = true;
      if (v.includes("option")) o = true;
    });
  });
  return q && o;
}

function validateQuestionRow(row, n) {
  const errors = [];

  if (!pick(row, ["Question","question"]))
    throw new Error(`Row ${n}: Missing 'Question'`);
    errors.push(`Row ${n}: Missing 'Question'`);

  ["A","B","C","D"].forEach(o => {
    if (!pick(row, [`Option ${o}`, o, `option ${o.toLowerCase()}`]))
      throw new Error(`Row ${n}: Missing 'Option ${o}'`);
      errors.push(`Row ${n}: Missing 'Option ${o}'`);
  });

  if (!pick(row, ["Answer(No Option)","Answer","answer","correct_option"]))
    throw new Error(`Row ${n}: Missing 'Answer(No Option)'`);
    errors.push(`Row ${n}: Missing 'Answer(No Option)'`);

  if (!pick(row, ["Topic","topic"]))
    throw new Error(`Row ${n}: Missing 'Topic'`);
    errors.push(`Row ${n}: Missing 'Topic'`);

  const diff = pick(row, ["Difficulty Level","Difficulty","difficulty","difficulty level"]);
  if (normalizeDifficultyLevel(diff) === null)
      throw new Error(
      `Row ${n}: Invalid 'Difficulty Level' - must be 1, 2, or 3 (found: '${diff}')`
    );
    errors.push(
      `Row ${n}: Invalid 'Difficulty Level' - must be 1, 2, or 3 (found: '${diff}')`
    );

  return { isValid: errors.length === 0, errors };
}

function parseWorksheetToQuestions(ws, sheetName) {
  let headerRow;
  ws.eachRow((r, i) =>
    r.eachCell(c => {
      if (extractPlainText(c.value).toLowerCase() === "question" && !headerRow)
        headerRow = i;
    })
  );
  if (!headerRow) return null;

  const headers = {};
  ws.getRow(headerRow).eachCell((c, i) => headers[i] = extractPlainText(c.value));

  const data = [], errs = [];

  ws.eachRow((r, i) => {
    if (i <= headerRow) return;
    const row = {};
    r.eachCell((c, j) => headers[j] && (row[headers[j]] = extractPlainText(c.value)));
    if (Object.keys(row).length) {
      const v = validateQuestionRow(row, i);
      v.isValid ? data.push(row) : errs.push(...v.errors);
    }
  });

  if (errs.length)
    throw new Error(`Validation errors in sheet '${sheetName}':\n${errs.join("\n")}`);

  return data.length ? { sheetName, data } : null;
}

async function parseExcelToQuestions(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const all = [], processed = [], skipped = [];

  for (const ws of wb.worksheets) {
    if (!isValidQuestionSheet(ws)) {
      skipped.push(ws.name);
      continue;
    }
    const res = parseWorksheetToQuestions(ws, ws.name);
    if (res) {
      all.push(...res.data);
      processed.push({ name: ws.name, count: res.data.length });
    } else skipped.push(ws.name);
  }

  if (!all.length) throw new Error("No valid question data found in any sheet");

  const map = {};
  all.forEach(r => {
    const topic = pick(r, ["Topic","topic"], "General").toUpperCase();
    map[topic] ||= [];
    const q = {
      question: pick(r, ["Question","question"]),
      A: pick(r, ["Option A","A"]),
      B: pick(r, ["Option B","B"]),
      C: pick(r, ["Option C","C"]),
      D: pick(r, ["Option D","D"]),
      correct_option: pick(r, ["Answer(No Option)","Answer","answer","correct_option"]),
      difficulty_level: normalizeDifficultyLevel(
        pick(r, ["Difficulty Level","Difficulty","difficulty","difficulty level"])
      )
    };
    const E = pick(r, ["Option E","E"]); if (E) q.E = E;
    const img = pick(r, ["Images (Image name)","Images","image"]); if (img) q.image = img;
    map[topic].push(q);
  });

  return {
    exam: Object.entries(map).map(([topic, topic_question]) => ({ topic, topic_question })),
    metadata: {
      totalSheets: wb.worksheets.length,
      processedSheets: processed,
      skippedSheets: skipped,
      totalQuestions: all.length
    }
  };
}

/* ================= DB ================= */

async function appendQuestionsToMongo(filetype, newExam) {
  const col = getDb().collection(COLLECTION_NAME);
  const subject_name = filetype.toUpperCase();
  const doc = await col.findOne({ subject_name });

  let added = 0, dup = 0;
  const map = new Map((doc?.exam || []).map(t => [t.topic, t.topic_question]));

  newExam.forEach(({ topic, topic_question }) => {
    map.set(topic, map.get(topic) || []);
    topic_question.forEach(q =>
      map.get(topic).some(e => isDuplicateQuestion(q, e))
        ? dup++
        : (map.get(topic).push(q), added++)
    );
  });

  await col.updateOne(
    { subject_name },
    { $set: { exam: [...map].map(([topic, topic_question]) => ({ topic, topic_question })) } },
    { upsert: true }
  );

  return { duplicatesFound: dup, questionsAdded: added };
}

/* ================= UPLOAD ================= */

function readUpload(req) {
  return new Promise((res, rej) => {
    let buffer, filename, filetype, size = 0;
    const bb = Busboy({ headers: req.headers });

    bb.on("field", (k, v) => k === "filetype" && (filetype = v.toLowerCase()));
    bb.on("file", (_, f, info) => {
      if (!isSupportedFileType(info.filename)) return rej(new Error("Unsupported file type"));
      filename = info.filename;
      const chunks = [];
      f.on("data", d => {
        size += d.length;
        if (size > MAX_FILE_SIZE) rej(new Error("File size exceeds 10MB"));
        chunks.push(d);
      });
      f.on("end", () => buffer = Buffer.concat(chunks));
    });
    bb.on("finish", () => res({ buffer, filename, filetype }));
    bb.on("error", rej);
    req.pipe(bb);
  });
}

const uploadQuestion = async (req, res) => {
  try {
    const { buffer, filename, filetype } = await readUpload(req);
    const xlsx = path.extname(filename) === ".xls"
      ? await convertXlsToXlsx(buffer)
      : buffer;

    const keyPath = getTypePath(filetype);
    const name = await getSafeFilename(keyPath, filename);

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `${keyPath}${name}`,
      Body: xlsx,
      ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }));

    const { exam, metadata } = await parseExcelToQuestions(xlsx);
    const result = await appendQuestionsToMongo(filetype, exam);

    res.json({ success: true, filePath: `${keyPath}${name}`, ...metadata, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/* ================= DELETE / GET ================= */

async function deleteQuestion(req, res) {
  const { subject_name, topic } = req.body;
  if (!subject_name || !topic)
    return res.status(400).json({ success: false, message: "subject_name and topic are required" });

  const r = await getDb().collection(COLLECTION_NAME)
    .updateOne({ subject_name }, { $pull: { exam: { topic } } });

  r.modifiedCount
    ? res.json({ success: true, message: "Topic deleted successfully" })
    : res.status(404).json({ success: false, message: "Topic not found or already deleted" });
}

const { fetchSubjectsWithTopics } = require("../../services/get_topics.service");

async function getSubject(req, res) {
  try {

    const s3link = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/qa-exam/template/QA_Question_Bank_Format_Sample.xlsx`;

    res.json({ success: true, data: await fetchSubjectsWithTopics(getDb()),s3link });
    
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { uploadQuestion, deleteQuestion, getSubject };
