import axios from "axios";
import { ArrowLeft, Power, AlertCircle, Trash2, Check } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";


const ReusableUploadPage = ({ title, description, options, apiUrl, uploadFor, instructions }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [topics, setTopics] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);


  const navigate = useNavigate();

  const subjectTopics = {
    QA: ["Testing Basics", "Manual Testing", "Automation", "Bug Lifecycle"],
    VR: ["OOP", "Collections", "Multithreading", "JVM"],
    BS: ["Components", "Hooks", "Props & State", "Routing"]
  };


  const handleSubmit = async () => {

  // 🔒 VALIDATIONS APPLY ONLY TO CUSTOM SUBJECT
  if (isCustomSubject) {

    if (!selectedOption) {
      Swal.fire(
        "Select Subject",
        "Please choose a subject",
        "warning"
      );
      return;
    }

    if (!file) {
      Swal.fire(
        "File Required",
        "Please upload a file",
        "warning"
      );
      return;
    }
  }

  // ⬇️ Existing submit logic continues (API call etc.)
};


  const handleDeleteSingleTopic = (topicToRemove) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${topicToRemove}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#800000",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setTopics((prevTopics) =>
          prevTopics.filter((topic) => topic !== topicToRemove)
        );

        Swal.fire({
          title: "Deleted!",
          text: `"${topicToRemove}" has been deleted.`,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    });
  };
  const handleAddNewSubject = async () => {
    const { value: subjectName } = await Swal.fire({
      title: "New Subject",
      input: "text",
      inputLabel: "Enter subject name",
      inputPlaceholder: "Eg: VR, QA",
      showCancelButton: true,
      confirmButtonColor: "#800000",
      inputValidator: (value) => {
        if (!value) return "Subject name cannot be empty";
      },
    });

    if (!subjectName) return;

    setCustomSubjects((prev) => [...prev, subjectName]);
    setSelectedOption(subjectName);
    setTopics([]); // new subject starts empty
    setIsCustomSubject(true);
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

            <div className="flex gap-6 justify-center flex-wrap">

              {/* Existing subjects (QA, Java, React) */}
              {options.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setSelectedOption(item);
                    setTopics(subjectTopics[item] || []);
                    setIsCustomSubject(false);
                  }}
                  className={`w-36 h-16 rounded-xl text-lg font-semibold border transition-all duration-200 ${selectedOption === item ? "shadow-md scale-105" : "hover:scale-105"
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

              {/* 🔥 CUSTOM SUBJECTS — THIS IS WHERE YOUR CODE GOES */}
              {customSubjects.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setSelectedOption(item);
                    setTopics([]);
                    setIsCustomSubject(true);
                  }}
                  className={`w-36 h-16 rounded-xl text-lg font-semibold border transition-all duration-200 ${selectedOption === item ? "shadow-md scale-105" : "hover:scale-105"
                    }`}
                  style={{
                    backgroundColor: selectedOption === item ? "#800000" : "#fdcc03",
                    borderColor: "#800000",
                    color: selectedOption === item ? "#fff" : "#000",
                  }}
                >
                  {item}
                </button>
              ))}

              {/* ➕ ADD NEW SUBJECT BUTTON */}
              <button
                onClick={handleAddNewSubject}
                className="w-36 h-16 rounded-xl text-lg font-semibold border-dashed border-2 hover:scale-105"
                style={{ borderColor: "#800000", color: "#800000" }}
              >
                + Add Subject
              </button>

            </div>

          </div>
        )}
        {selectedOption && !isCustomSubject &&(
          <>
            <p className="text-lg font-semibold" style={{ color: "#800000" }}>
              Topics for {selectedOption}
            </p>

            <div className="flex justify-around w-full items-center">
              {topics.length > 0 && (
                <div>
                  <ol className="ml-[150px] list-decimal flex flex-row w-[90%] justify-center items-center pl-6 space-y-3">
                    {topics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-evenly w-[30%] m-3"
                      >
                        <span>{topic}</span>

                        <button
                          type="button"
                          onClick={() => handleDeleteSingleTopic(topic)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          <Trash2 size={18} />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div>
                <button
                  type="button"
                  title="Confirm / Approve"
                  className="text-green-600 hover:text-green-800 bg-green-100 p-2 rounded-full"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          </>
        )}


        {/* <button
            className="qa-delete-btn"
            title="Delete Topics"
            type="button"
            onClick={handleDeleteSingleTopic}
            disabled={topics.length === 0}
            style={{ opacity: topics.length === 0 ? 0.5 : 1 }}
          >
            <div className="flex items-center gap-2 bg-brwn text-prim px-4 py-2 rounded text-l">
              <Trash2 size={18} />
              <span>Delete</span>
            </div>
          </button> */}



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