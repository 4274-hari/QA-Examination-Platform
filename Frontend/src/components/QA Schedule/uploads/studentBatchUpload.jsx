import React from "react";
import ReusableUploadPage from "./ReusableUploadPage";

const StudentBatchUploadPage = () => {
  return (
    <ReusableUploadPage
      title="Student New Batch Upload"
      description="Upload Excel file for creating new student batch in database"
      options={[]}
      apiUrl="/api/main-backend/examiner/students/upload"
      uploadFor="student"
    />
  );
};

export default StudentBatchUploadPage;