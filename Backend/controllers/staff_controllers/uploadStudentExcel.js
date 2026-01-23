const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const Busboy = require("busboy");
const { getDb } = require("../../config/db");

/* ===================== CONSTANTS ===================== */

const REQUIRED_HEADERS = [
  "S.No",
  "Student Name",
  "Register No",
  "Batch",
  "Programme",
  "Sec",
  "Date of Birth",
  "Student Mobile",
  "Email Id"
];

const COLUMN_MAP = {
  "S.No": "A",
  "Student Name": "B",
  "Register No": "C",
  "Batch": "D",
  "Programme": "E",
  "Sec": "F",
  "Date of Birth": "G",
  "Student Mobile": "H",
  "Email Id": "I"
};

/* ===================== HELPERS ===================== */

// Uppercase only alphabets, preserve everything else
function uppercaseOnlyAlphabets(value) {
  if (!value) return "";
  return String(value).replace(/[a-z]/g, ch => ch.toUpperCase());
}

// Extract department from programme
function extractDepartment(programme) {
  if (!programme) return "";
  return programme
    .replace(/^B\.E\.\s*/i, "")
    .replace(/^B\.Tech\.\s*/i, "")
    .trim()
    .toUpperCase();
}

// Normalize DOB from Excel Date / serial / string
function normalizeDOB(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return `${String(value.getDate()).padStart(2, "0")}-${String(
      value.getMonth() + 1
    ).padStart(2, "0")}-${value.getFullYear()}`;
  }

  if (typeof value === "number") {
    const base = new Date(1900, 0, 1);
    const d = new Date(base.getTime() + (value - 2) * 86400000);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  }

  return String(value).trim();
}

// Log duplicate register cell
function logDuplicateCell(row, value) {
  console.warn("⚠️ DUPLICATE DETECTED");
  console.warn(`   Row    : ${row}`);
  console.warn(`   Column : Register No`);
  console.warn(`   Cell   : C${row}`);
  console.warn(`   Value  : "${value}"`);
  console.warn(`   Reason : Already exists in database (skipped)`);
}

// Log validation errors
function logExcelError(row, column, value, reason) {
  console.error("❌ EXCEL VALIDATION ERROR");
  console.error(`   Row    : ${row}`);
  console.error(`   Column : ${column}`);
  console.error(`   Cell   : ${COLUMN_MAP[column]}${row}`);
  console.error(`   Value  : "${value}"`);
  console.error(`   Reason : ${reason}`);
}

/* ===================== VALIDATORS ===================== */

const isRegisterNoValid = v => /^[0-9]+$/.test(v);

const isBatchValid = v => {
  if (!/^\d{4}-\d{4}$/.test(v)) return false;
  const [s, e] = v.split("-").map(Number);
  return e - s === 4;
};

const isProgrammeValid = v =>
  /^(B\.E\.|B\.Tech\.)\s+.+/.test(v);

const isSectionValid = v => /^[A-Z]$/.test(v);

const isDOBValid = v => /^\d{2}-\d{2}-\d{4}$/.test(v);

/* ===================== XLS → XLSX ===================== */

function convertXlsToXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const newWb = XLSX.utils.book_new();
  wb.SheetNames.forEach(name =>
    XLSX.utils.book_append_sheet(newWb, wb.Sheets[name], name)
  );
  return XLSX.write(newWb, { bookType: "xlsx", type: "buffer" });
}

/* ===================== CONTROLLER ===================== */

const uploadStudentExcel = async (req, res) => {
  try {
    const busboy = Busboy({ headers: req.headers });
    let buffers = [];
    let filename = "";

    busboy.on("file", (field, file, info) => {
      filename = info.filename;
      const ext = filename.split(".").pop().toLowerCase();

      if (!["xlsx", "xls"].includes(ext)) {
        file.resume();
        return res.status(400).json({
          success: false,
          message: "Only .xlsx or .xls files are allowed"
        });
      }

      file.on("data", d => buffers.push(d));
    });

    busboy.on("finish", async () => {
      if (!buffers.length) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      let fileBuffer = Buffer.concat(buffers);
      if (filename.endsWith(".xls")) {
        fileBuffer = convertXlsToXlsx(fileBuffer);
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const sheet = workbook.worksheets[0];

      if (!sheet) {
        return res.status(400).json({
          success: false,
          message: "Excel sheet missing"
        });
      }

      // Header validation
      const headers = sheet.getRow(1).values.slice(1);
      if (
        headers.length !== REQUIRED_HEADERS.length ||
        !headers.every((h, i) => h === REQUIRED_HEADERS[i])
      ) {
        return res.status(400).json({
          success: false,
          message: "Excel column order or names are invalid"
        });
      }

      const db = getDb();
      const studentsCol = db.collection("student");

      const excelRows = [];
      const excelRegs = [];

      // First pass
      for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
        const r = sheet.getRow(rowIndex).values.slice(1);
        const reg = String(r[2] || "").trim();
        excelRegs.push(reg);

        excelRows.push({
          rowIndex,
          rawName: r[1],
          reg,
          batch: r[3],
          programme: r[4],
          sec: r[5],
          dobRaw: r[6],
          mobile: r[7],
          email: r[8]
        });
      }

      const existing = await studentsCol
        .find({ registerno: { $in: excelRegs } }, { projection: { registerno: 1 } })
        .toArray();

      const existingSet = new Set(existing.map(e => e.registerno));
      const studentsToInsert = [];
      let skipped = 0;

      for (const row of excelRows) {
        // Duplicate → skip
        if (existingSet.has(row.reg)) {
          logDuplicateCell(row.rowIndex, row.reg);
          skipped++;
          continue;
        }

        // Validations
        if (!isRegisterNoValid(row.reg)) {
          logExcelError(row.rowIndex, "Register No", row.reg, "Invalid Register Number");
          return res.status(400).json({ success: false, message: "Invalid Register Number" });
        }

        if (!isBatchValid(String(row.batch || ""))) {
          logExcelError(row.rowIndex, "Batch", row.batch, "Invalid Batch");
          return res.status(400).json({ success: false, message: "Invalid Batch" });
        }

        if (!isProgrammeValid(String(row.programme || ""))) {
          logExcelError(row.rowIndex, "Programme", row.programme, "Invalid Programme");
          return res.status(400).json({ success: false, message: "Invalid Programme" });
        }

        if (!isSectionValid(String(row.sec || ""))) {
          logExcelError(row.rowIndex, "Sec", row.sec, "Invalid Section");
          return res.status(400).json({ success: false, message: "Invalid Section" });
        }

        const dob = normalizeDOB(row.dobRaw);
        if (!isDOBValid(dob)) {
          logExcelError(row.rowIndex, "Date of Birth", row.dobRaw, "Invalid DOB");
          return res.status(400).json({ success: false, message: "Invalid DOB" });
        }

        studentsToInsert.push({
          name: uppercaseOnlyAlphabets(row.rawName),
          registerno: row.reg,
          batch: String(row.batch).trim(),
          department: extractDepartment(row.programme),
          section: row.sec,
          password: dob,
          phone: row.mobile || "",
          email: row.email ? String(row.email).toLowerCase() : ""
        });
      }

      if (studentsToInsert.length) {
        await studentsCol.insertMany(studentsToInsert);
      }

      return res.status(200).json({
        success: true,
        message: "Excel processed successfully",
        inserted: studentsToInsert.length,
        skippedDuplicates: skipped
      });
    });

    req.pipe(busboy);
  } catch (err) {
    console.error("❌ CONTROLLER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = { uploadStudentExcel };