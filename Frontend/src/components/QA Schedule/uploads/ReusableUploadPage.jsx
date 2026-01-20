import axios from "axios";
import { ArrowLeft, Power, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router";

const ReusableUploadPage = ({ title, description, options, apiUrl, uploadFor, instructions }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select option and upload file");
      return;
    }

    const formData = new FormData();
    if (uploadFor === "question") {
      formData.append("filetype", selectedOption);
      formData.append("file", file);
    } else if (uploadFor === "student") {
      formData.append("file", file);
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await axios.post(apiUrl, formData);
      console.log(response.data);
      alert(`${title} uploaded successfully`);
      setSelectedOption("");
      setFile(null);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Upload failed due to an unknown error.";
      console.error("Upload error:", error);
      setErrorMessage(msg);
      setShowInstructions(true);
      alert("Upload failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-[90%] bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center gap-10 p-4">
        <div className="w-full flex justify-between">
          <button className="flex gap-2 justify-center items-center" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-md border"
              onClick={() => {
                setErrorMessage("");
                setShowInstructions(true);
              }}
              title="Instructions"
              type="button"
              style={{ borderColor: "#f0c000", color: "#000", backgroundColor: "#fff" }}
            >
              <AlertCircle size={16} />
            </button>

            <button
              className="qa-logout-btn flex items-center gap-2 px-3 py-2 rounded-md border"
              onClick={() => {
                sessionStorage.removeItem("userSession");
                navigate("/login");
              }}
              title="Log out"
              type="button"
              style={{ borderColor: "#f0c000", color: "#000", backgroundColor: "#fff" }}
            >
              <Power size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#800000" }}>
            {title}
          </h1>
          <p className="text-gray-500">{description}</p>
        </div>

        {options && options.length > 0 && (
          <div className="w-full">
            <p className="text-lg font-semibold mb-4" style={{ color: "#800000" }}>
              Choose Type
            </p>

            <div className="flex gap-6 justify-center">
              {options.map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedOption(item)}
                  className={`w-36 h-16 rounded-xl text-lg font-semibold border transition-all duration-200 ${
                    selectedOption === item ? "shadow-md scale-105" : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: selectedOption === item ? "#800000" : "transparent",
                    borderColor: "#800000",
                    color: selectedOption === item ? "#ffffff" : "#000000",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full">
          <p className="text-lg font-semibold mb-4" style={{ color: "#800000" }}>
            Upload Excel File
          </p>

          <div
            className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4"
            style={{ borderColor: "#800000" }}
          >
            <input
              type="file"
              accept=".xls,.xlsx"
              id="excelUpload"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label
              htmlFor="excelUpload"
              className="cursor-pointer px-8 py-3 rounded-lg font-medium"
              style={{ backgroundColor: "#fdcc03", color: "#000" }}
            >
              {file ? "Change File" : "Choose File"}
            </label>
            {file && <p className="text-sm text-gray-700 font-medium">{file.name}</p>}
            <p className="text-sm text-gray-500">Only .xls and .xlsx files supported</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-3 rounded-xl font-semibold"
          style={{ backgroundColor: "#800000", color: "#fff" }}
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center mt-5">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowInstructions(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-3xl p-6 z-10">
            <div className="relative flex items-center justify-center">
              <h2 className="text-2xl font-bold text-center" style={{ color: "#800000" }}>
                Instruction
              </h2>
            </div>
            <div className="mt-4">
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                {(instructions || []).map((ins, idx) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ol>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-6 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: "#800000", color: "#fff" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReusableUploadPage;