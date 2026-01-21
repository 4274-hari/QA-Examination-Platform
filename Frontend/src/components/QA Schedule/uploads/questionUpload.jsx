import React, { useEffect, useState } from "react";
import ReusableUploadPage from "./ReusableUploadPage";
import axios from "axios";

const QuestionUploadPage = () => {
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
    "Double-check data for typos before upload"
  ];
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responce = await axios.get('/api/main-backend/examiner/questions/subjects');
        setSubjects(responce.data.data)        
      } catch (error) {
        console.error("Error fetching Subjects data", error);
      }
    }

    fetchData()
  }, [])  

  return (
    <ReusableUploadPage
      title="Question Data Upload"
      description="Upload Excel file containing QA/VR/BS Questions"
      options={subjects}
      apiUrl="/api/main-backend/examiner/questions/upload"
      uploadFor="question"
      instructions={instructions}
    />
  );
};

export default QuestionUploadPage;