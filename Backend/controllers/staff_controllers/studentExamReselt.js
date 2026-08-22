const PDFDocument = require("pdfkit");
const axios = require("axios");
const path = require("path");
const { getDb } = require("../../config/db");

// ============================================================
// CONFIGURATION
// ============================================================
const LOGO_URL = "https://aptitudevec.in/VEC%20Logo.png";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getSelectedOption(question) {
  return (
    question.choosedOption ??
    question.selected_option ??
    question.selectedOption ??
    question.student_selected_option ??
    question.studentSelectedOption ??
    null
  );
}

function getOptionLetter(question, selected) {
  if (selected == null) return null;
  const value = String(selected).trim();
  if (["A", "B", "C", "D"].includes(value.toUpperCase()))
    return value.toUpperCase();
  for (const option of ["A", "B", "C", "D"]) {
    if (String(question[option] ?? "").trim() === value) return option;
  }
  return null;
}

function getCorrectOptionLetter(question) {
  const correct = String(question.correct_option ?? "").trim();
  if (["A", "B", "C", "D"].includes(correct.toUpperCase()))
    return correct.toUpperCase();
  for (const option of ["A", "B", "C", "D"]) {
    if (String(question[option] ?? "").trim() === correct) return option;
  }
  return null;
}

async function getLogoBuffer() {
  const response = await axios.get(LOGO_URL, {
    responseType: "arraybuffer",
    timeout: 10000,
  });
  return Buffer.from(response.data);
}

function drawOptionsSingleRow(doc, question, startX, maxWidth) {
  const options = ["A", "B", "C", "D"];
  let fontSize = 10;

  while (fontSize >= 6) {
    doc.font("DejaVu").fontSize(fontSize);
    let totalWidth = 0;
    options.forEach((opt) => {
      const optText = question[opt] || "";
      totalWidth += doc.widthOfString(`${opt}. ${optText}`) + 20;
    });

    if (totalWidth <= maxWidth) break;
    fontSize -= 0.5;
  }

  doc.font("DejaVu").fontSize(fontSize);
  let currentX = startX;
  const yPos = doc.y;

  options.forEach((opt) => {
    const optText = question[opt] || "";
    const text = `${opt}. ${optText}`;
    doc.text(text, currentX, yPos, { lineBreak: false });
    currentX += doc.widthOfString(text) + 20;
  });

  doc.y = yPos + fontSize + 8;
}

// ============================================================
// MAIN CONTROLLER
// ============================================================
async function studentResult(req, res) {
  try {
    const {
      registerno,
      cie,
      batch,
      regulation,
      academic_year,
      semester,
      department,
      isRetest = false,
      isArrear = false,
    } = req.body;

    if (!registerno || !cie || !batch) {
      return res.status(400).json({
        success: false,
        message: "registerno, batch, and cie are required",
      });
    }

    const db = getDb();

    const filterQuery = {
      registerno: String(registerno),
      batch: String(batch),
      cie: String(cie),
      isStudentExam: true,
      isRetest: Boolean(isRetest),
      isArrear: Boolean(isArrear),
    };

    if (regulation) filterQuery.regulation = String(regulation);
    if (academic_year) filterQuery.academic_year = String(academic_year);
    if (semester) filterQuery.semester = String(semester);
    if (department) filterQuery.department = String(department);

    const exam = await db.collection("qa_exam").findOne(filterQuery);

    if (!exam || !exam.questions || exam.questions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Exam/Questions not found" });
    }

    // --- CALCULATE TOTAL MARKS ---
    let totalMarks = 0;
    exam.questions.forEach((q) => {
      const selected = getSelectedOption(q);
      const selectedLetter = getOptionLetter(q, selected);
      const correctLetter = getCorrectOptionLetter(q);

      const isAttempted = selectedLetter !== null;
      const isCorrect =
        q.isCorrect === true ||
        (isAttempted &&
          correctLetter !== null &&
          selectedLetter === correctLetter);

      if (isCorrect) {
        totalMarks++;
      }
    });

    let logoBuffer;
    try {
      logoBuffer = await getLogoBuffer();
    } catch (err) {
      console.error("Logo fetch error:", err.message);
    }

    // Initialize Document
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 20, left: 50, right: 50 },
    });

    // Make sure this is at the very top of your file with your other requires:
    // const path = require("path");\

    doc.registerFont(
      "DejaVu",
      path.join(__dirname, "../../fonts/DejaVuSans.ttf"),
    );

    doc.registerFont(
      "DejaVu-Bold",
      path.join(__dirname, "../../fonts/DejaVuSans-Bold.ttf"),
    );

    doc.registerFont(
      "DejaVu-Italic",
      path.join(__dirname, "../../fonts/DejaVuSans-Oblique.ttf"),
    );

    const category = exam.isRetest
      ? "Retest"
      : exam.isArrear
        ? "Arrear"
        : "Normal";
    const rawFileName = `${exam.registerno}_${exam.cie}_${category}_${exam.semester || "Sem"}_${exam.academic_year || "Year"}_Result.pdf`;
    const fileName = rawFileName.replace(/\s+/g, "_");

    res.status(200).setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    doc.pipe(res);

    const startX = 50;
    const contentWidth = 495;

    // ============================================================
    // 1. PROFESSIONAL HEADER
    // ============================================================

    if (logoBuffer) {
      doc.image(logoBuffer, 65, 30, { width: 50 });
    }

    doc
      .font("Times-Bold")
      .fontSize(9)
      .text("VELAMMAL", 35, 85, { width: 110, align: "center" });

    doc
      .font("Times-Bold")
      .fontSize(7)
      .text("ENGINEERING COLLEGE", 35, 96, { width: 110, align: "center" });

    doc
      .font("Times-Italic")
      .fontSize(6)
      .text("The Wheel of Knowledge rolls on!", 35, 106, {
        width: 110,
        align: "center",
      });

    doc
      .font("Times-Italic")
      .fontSize(6)
      .text("(An Autonomous Institution)", 35, 114, {
        width: 110,
        align: "center",
      });

    doc
      .font("Times-Bold")
      .fontSize(16)
      .text("VELAMMAL ENGINEERING COLLEGE", startX, 55, {
        width: contentWidth,
        align: "center",
      });

    doc.font("Times-Bold").fontSize(14).text("QA Aptitude result", startX, 85, {
      width: contentWidth,
      align: "center",
      underline: true,
    });

    doc
      .moveTo(startX, 125)
      .lineTo(startX + contentWidth, 125)
      .lineWidth(1)
      .stroke();

    // ============================================================
    // 2. TWO-COLUMN STUDENT DETAILS
    // ============================================================
    const detailsY = 135;
    const rightColX = startX + 340;

    doc.font("DejaVu-Bold").fontSize(10);

    // --- LEFT COLUMN ---
    doc.text("Name:", startX, detailsY, { continued: true });
    doc.font("DejaVu").text(` ${exam.name || "N/A"}`);

    doc
      .font("DejaVu-Bold")
      .text("Register No:", startX, detailsY + 20, { continued: true });
    doc.font("DejaVu").text(` ${exam.registerno || "N/A"}`);

    doc
      .font("DejaVu-Bold")
      .text("Department:", startX, detailsY + 40, { continued: true });
    doc.font("DejaVu").text(` ${exam.department || "N/A"}`);

    doc
      .font("DejaVu-Bold")
      .text("Section:", startX, detailsY + 60, { continued: true });
    doc.font("DejaVu").text(` ${exam.section || "N/A"}`);

    // --- RIGHT COLUMN ---
    doc
      .font("DejaVu-Bold")
      .text("Test / CIE:", rightColX, detailsY, { continued: true });
    doc.font("DejaVu").text(` ${exam.cie ? exam.cie.toUpperCase() : "N/A"}`);

    doc
      .font("DejaVu-Bold")
      .text("Date:", rightColX, detailsY + 20, { continued: true });
    doc.font("DejaVu").text(` ${exam.date || "N/A"}`);

    doc
      .font("DejaVu-Bold")
      .text("Category:", rightColX, detailsY + 40, { continued: true });
    doc.font("DejaVu").text(` ${category}`);

    doc
      .font("DejaVu-Bold")
      .text("Marks:", rightColX, detailsY + 60, { continued: true });
    doc.font("DejaVu").text(` ${totalMarks} / ${exam.questions.length}`);

    doc.y = detailsY + 90;

    // ============================================================
    // 3. QUESTIONS LIST
    // ============================================================
    exam.questions.forEach((question, index) => {
      // Manual break logic
      if (doc.y > 680) {
        doc.addPage();
      }

      const qNo = question.questionNumber || index + 1;
      const cleanQuestion = question.question || "";

      doc.font("DejaVu-Bold").fontSize(10);
      doc.text(`${qNo}. ${cleanQuestion}`, startX, doc.y, {
        width: contentWidth,
        align: "justify",
      });
      doc.moveDown(0.5);

      drawOptionsSingleRow(doc, question, startX + 15, contentWidth - 15);

      const selected = getSelectedOption(question);
      const selectedLetter = getOptionLetter(question, selected);
      const correctLetter = getCorrectOptionLetter(question);
      const isAttempted = selectedLetter !== null;

      const isCorrect =
        question.isCorrect === true ||
        (isAttempted &&
          correctLetter !== null &&
          selectedLetter === correctLetter);

      doc.font("DejaVu").fontSize(9);
      if (isAttempted) {
        const selectedText = question[selectedLetter] ?? selected;
        doc.text(
          `Student Selected : ${selectedLetter}. ${selectedText}`,
          startX + 15,
          doc.y,
        );
      } else {
        doc
          .font("DejaVu-Italic")
          .text(`Student Selected : Not Attempted`, startX + 15, doc.y);
      }
      doc.moveDown(0.2);

      doc.font("DejaVu").fontSize(9);
      const correctText = correctLetter
        ? question[correctLetter]
        : question.correct_option;

      doc.text(
        `Correct Answer   : ${correctLetter ?? "-"}. ${correctText}`,
        startX + 15,
        doc.y,
      );
      doc.moveDown(0.2);

      if (isAttempted) {
        doc.font("DejaVu-Bold").fillColor(isCorrect ? "green" : "red");
        doc.text(
          `Result: ${isCorrect ? "CORRECT" : "WRONG"}`,
          startX + 15,
          doc.y,
        );
        doc.fillColor("black");
      }

      doc.moveDown(0.5);

      doc
        .moveTo(startX, doc.y)
        .lineTo(startX + contentWidth, doc.y)
        .lineWidth(0.5)
        .strokeOpacity(0.3)
        .stroke();
      doc.strokeOpacity(1);

      // Only add extra gap space if it is not the last question
      if (index < exam.questions.length - 1) {
        doc.moveDown(1);
      }
    });

    doc.end();
  } catch (error) {
    console.error("Student result PDF error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      });
    }
    res.end();
  }
}

module.exports = { studentResult };
