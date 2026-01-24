import React from "react";
import ReusableUploadPage from "./ReusableUploadPage";

const StudentBatchUploadPage = () => {

const instructions = [
  "The Student Name should be entered only in capital letters, with initials placed after the name without using full stops, and nicknames, abbreviations, or extra spaces should be strictly avoided.",
  "The Register Number should be entered exactly as officially issued, the column should be maintained in General format only, and date, time, scientific formats, or loss of leading zeros should not occur.",
  "The Batch should be entered strictly in the YYYY-YYYY format using only a hyphen without spaces, and the ending year should be exactly four years after the starting year.",
  "The Programme name should be entered only in the approved format, where B.Tech. and B.E. should be written exactly as specified without variations or short forms.",
  "The Section should be entered as a single capital letter only, and numbers, symbols, multiple characters, or spaces should not be used.",
  "The Date of Birth should be entered strictly in DD-MM-YYYY format, the column should remain in General format, and slashes or time values should not be used.",
  "The Mobile Number should contain exactly 10 digits, and country codes, spaces, symbols, or alphabetic characters should not be included.",
  "The Email ID should be entered only in a valid username@domain.extension format using lowercase letters, and spaces or multiple email IDs should not be entered.",
  "The Excel sheet structure should be preserved by keeping column names and order unchanged, and additional columns should not be added.",
  "Entries that do not adhere to the prescribed format will be treated as invalid and will be returned for correction."
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