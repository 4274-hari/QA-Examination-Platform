import React from "react";
import ReusableUploadPage from "./ReusableUploadPage";

const StudentBatchUploadPage = () => {

    const instructions = [
    "Ensure the Excel file uses the provided template format.",
    "Do not change column headers or reorder columns.",
    "Remove any empty rows before uploading.",
    "Student ID must be unique and numeric.",
    "Provide valid email addresses for students.",
    "Use YYYY-MM-DD format for date fields.",
    "Do not include formulas; use plain values.",
    "Maximum file size allowed is 5MB.",
    "Only .xls and .xlsx formats are supported.",
    "Double-check data for typos before upload."
  ];

  return (
    <ReusableUploadPage
      title="Student New Batch Upload"
      description="Upload Excel file for creating new student batch in database"
      options={[]}
      apiUrl="/api/main-backend/examiner/students/upload"
      uploadFor="student"
      instructions={instructions}
      enableBatchDelete={true}
    />
  );
};

export default StudentBatchUploadPage;