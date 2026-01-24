import axios from "axios";
import { ArrowLeft, Power, AlertCircle, Trash2, Check } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ReusableUploadPage = ({ title, description, options, apiUrl, uploadFor, instructions, enableBatchDelete = false, }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [topics, setTopics] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState("");
  const [studentRegs, setStudentRegs] = useState("");
  const [batchList, setBatchList] = useState([]);
  const [mode, setMode] = useState("upload"); 
  const [studentForm, setStudentForm] = useState({
    name: "",
    registerno: "",
    password: "",
    department: "",
    batch: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    setSubjects(options)
  }, [options])

    useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await axios.get("/api/main-backend/examiner/forms");
        setBatchList(res.data.batch);
      } catch (error) {
        console.error("Error fetching the Student Batch", error);
      }
    };

    fetchBatch();
  }, []);
  

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

    if (!file) {
      Swal.fire(
        "File Required",
        "Please upload a file",
        "warning"
      );
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
      Swal.fire({
        title: "Success!",
        text:  response.data.message || `"${selectedOption}" has been uploaded Successfully.`,
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
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
      Swal.fire({
        title: "Error!",
        text: msg || `"Error Adding ${selectedOption}"`,
        icon: "error",
        timer: 1200,
        showConfirmButton: false,
      });
      setShowInstructions(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingleTopic = async (topicName) => {
    const result = await Swal.fire({
      title: "Delete topic?",
      text: `Delete "${topicName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#800000",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        "/api/main-backend/examiner/topics",
        {
          data: {
            subject_name: selectedOption,
            topic: topicName,
          },
        }
      );

      // ✅ UPDATE STATE AFTER SUCCESS
      setTopics(prevTopics =>
        prevTopics.filter(topic => topic !== topicName)
      );

      Swal.fire({
        title: "Deleted!",
        text: `"${topicName}" removed.`,
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });

    } catch (error) {
      Swal.fire(
        "Error",
        error?.response?.data?.error || "Failed to delete topic",
        "error"
      );
    }
  };

  const handleDeleteSingleSubject = async (subjectName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete subject "${subjectName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#800000",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        "/api/main-backend/examiner/subjects",
        {
          data: { subject_name: subjectName },
        }
      );

      // ✅ UPDATE STATE AFTER SUCCESS
      setSelectedOption("");
      setTopics([]);
      setIsCustomSubject(false);

      setCustomSubjects(prev =>
        prev.filter(sub => sub !== subjectName)
      );

      setSubjects(prevSubjects =>
        prevSubjects.filter(
          subject => subject.subject_name !== subjectName
        )
      );

      Swal.fire({
        title: "Deleted!",
        text: `"${subjectName}" has been deleted.`,
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

    } catch (error) {
      Swal.fire(
        "Error",
        error?.response?.data?.error || "Failed to delete subject",
        "error"
      );
    }
  };

  const handleAddNewSubject = async () => {
    const { value: subjectName, isConfirmed } = await Swal.fire({
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

    if (!isConfirmed) return;

    try {
      const res = await axios.post(
        "/api/main-backend/examiner/subjects",
        { subject_name: subjectName }
      );

      Swal.fire({
        title: "Added!",
        text: res.data.message || `"${subjectName}" added.`,
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      setCustomSubjects(prev => [...prev, subjectName]);
      setSelectedOption(subjectName);
      setTopics([]);
      setIsCustomSubject(true);

    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error?.response?.data?.error || "Failed to add subject",
        icon: "error",
      });
    }
  };

  const handleBatchDelete = async () => {
    if (!batchToDelete) {
      Swal.fire("Batch required", "Enter batch name", "warning");
      return;
    }

    const delete_student = studentRegs
      ? studentRegs.split(",").map(r => r.trim())
      : [];

    const payload = {
      batch: batchToDelete,
    };

    if (delete_student.length > 0) {
      payload.delete_student = delete_student;
    } else {
      payload.delete_batch = [batchToDelete];
    }

    const confirm = await Swal.fire({
      title: "Confirm Delete",
      text: delete_student.length
        ? "Delete selected students?"
        : "Delete entire batch?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#800000",
    });

    if (!confirm.isConfirmed) return;

    console.log("payload",payload);
    

    try {
      await axios.delete("/api/main-backend/examiner/students/batch",{
        data: payload
      });

      Swal.fire({
        title: "Deleted",
        text: "Deletion successful",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      setBatchToDelete("");
      setStudentRegs("");

    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Delete failed",
        "error"
      );
    }
  };

  const handleAddStudent = async () => {
    const { name, registerno, password, department, batch } = studentForm;

    if (!name || !registerno || !password || !department || !batch) {
      Swal.fire("Error", "All fields are required", "warning");
      return;
    }

    try {
      await axios.post("/api/main-backend/examiner/students", studentForm);

      Swal.fire({
        title: "Success",
        text: "Student added successfully",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      setStudentForm({
        name: "",
        registerno: "",
        password: "",
        department: "",
        batch: "",
      });

    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to add student",
        "error"
      );
    }
  };

  return (
    <>
      {showInstructions ? (
        <div className="flex items-center justify-center m-6">
          <div className="absolute inset-0 w-full h-full" onClick={() => setShowInstructions(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[100%] lg:w-[70%] p-8 z-10">
            <div className="relative flex items-center justify-center mb-6">
              <h2 className="text-2xl font-bold text-center" style={{ color: "#800000" }}>
                Instructions
              </h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute right-0 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="mt-4 max-h-96 overflow-y-auto">
              <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                {(instructions || []).map((ins, idx) => (
                  <li key={idx} className="text-base">{ins}</li>
                ))}
              </ol>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-8 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
                style={{ backgroundColor: "#800000", color: "#fff" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-[90%] bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-8 p-6 md:p-8">
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
          
          {title === "Student New Batch Upload" && subjects.length == 0 && (
            <div className="flex gap-4 my-6">
              {[
                { key: "upload", label: "Upload Excel" },
                // { key: "add", label: "Add Student" },
                { key: "delete", label: "Delete Student / Batch" }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setMode(item.key)}
                  className="px-6 py-2 rounded-lg font-semibold border transition-all"
                  style={{
                    backgroundColor: mode === item.key ? "#800000" : "#fff",
                    color: mode === item.key ? "#fff" : "#800000",
                    borderColor: "#800000",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {subjects && subjects.length > 0 && (
            <div className="w-1/2">
              <p className="text-lg font-semibold mb-6 pb-3 border-b-2 border-gray-200" style={{ color: "#800000" }}>
                Choose Subject Type
              </p>

              <div className="flex gap-4 justify-center flex-wrap">

                {/* Existing subjects (QA, Java, React) */}
                {subjects.map((item,idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedOption(item?.subject_name);
                      setTopics(item?.topics || []);
                      setIsCustomSubject(false);
                    }}
                    className={`px-6 py-3 rounded-lg text-base font-semibold border-2 transition-all duration-300 hover:shadow-lg ${selectedOption === item?.subject_name ? "shadow-lg scale-105" : "hover:scale-105"
                      }`}
                    style={{
                      backgroundColor: selectedOption === item?.subject_name ? "#800000" : "#fff",
                      borderColor: "#800000",
                      color: selectedOption === item?.subject_name ? "#ffffff" : "#800000",
                    }}
                  >
                    {item?.subject_name}
                  </button>
                ))}

                {customSubjects.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedOption(item);
                      setTopics([]);
                      setIsCustomSubject(true);
                    }}
                    className={`px-6 py-3 rounded-lg text-base font-semibold border-2 transition-all duration-300 hover:shadow-lg ${selectedOption === item ? "shadow-lg scale-105" : "hover:scale-105"
                      }`}
                    style={{
                      backgroundColor: selectedOption === item ? "#800000" : "#fff",
                      borderColor: "#800000",
                      color: selectedOption === item ? "#fff" : "#800000",
                    }}
                  >
                    {item}
                  </button>
                ))}

                {/* ➕ ADD NEW SUBJECT BUTTON */}
                <button
                  onClick={handleAddNewSubject}
                  className="px-6 py-3 rounded-lg text-base font-semibold border-2 border-dashed hover:scale-105 transition-all duration-300"
                  style={{ borderColor: "#800000", color: "#800000", backgroundColor: "#fff" }}
                >
                  + Add Subject
                </button>

              </div>

              <div className="w-full flex justify-center m-8">
                <button
                  className="qa-delete-btn"
                  title="Delete Subject"
                  type="button"
                  onClick={() => handleDeleteSingleSubject(selectedOption)}
                  disabled={!selectedOption}
                  style={{ opacity: !selectedOption ? 0.5 : 1 }}
                >
                  <div className="flex items-center gap-2 bg-brwn text-prim px-6 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md">
                    <Trash2 size={18} />
                    <span>Delete Subject</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {selectedOption && !isCustomSubject &&(
            <>
              <div className="w-full">
                <p className="w-1/2 text-lg font-semibold mb-6 pb-3 border-b-2 border-gray-200" style={{ color: "#800000" }}>
                  Topics in {selectedOption}
                </p>

                <div className="flex justify-center items-center w-full">
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-3 justify-center w-full">
                      {topics.map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                        >
                          <span className="font-medium text-gray-700">{topic}</span>

                          <button
                            type="button"
                            onClick={() => handleDeleteSingleTopic(topic)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {topics.length === 0 && (
                    <p className="text-gray-400 italic">No topics available for this subject</p>
                  )}
                </div>
              </div>
            </>
          )}

          {mode === "add" && (
            <div className="w-full max-w-xl">
              <p className="text-lg font-semibold mb-4" style={{ color: "#800000" }}>
                Add Individual Student
              </p>

              <div className="flex flex-col gap-4">
                {["name", "registerno", "password", "department", "batch"].map(field => (
                  <input
                    key={field}
                    placeholder={field.toUpperCase()}
                    value={studentForm[field]}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, [field]: e.target.value })
                    }
                    className="border p-3 rounded"
                  />
                ))}

                <button
                  onClick={handleAddStudent}
                  className="px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: "#800000", color: "#fff" }}
                >
                  Add Student
                </button>
              </div>
            </div>
          )}

          {mode === "delete" && enableBatchDelete && (
            <div className="w-1/2 mt-6 border-t pt-6">
              <p className="text-lg font-semibold mb-4" style={{ color: "#800000" }}>
                Delete Students / Batch
              </p>

              <div className="flex flex-col gap-4">

                <select
                  // multiple
                  value={batchToDelete}
                  onChange={(e) => setBatchToDelete(e.target.value)}
                  className="border p-3 rounded"
                >
                  
                  {["Select Batch To Delete", ...batchList].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <input
                  // type="text"
                  // placeholder="Register numbers (comma separated, optional)"
                  // value={studentRegs}
                  // onChange={(e) => setStudentRegs(e.target.value)}
                  // className="border p-3 rounded"
                />

                <button
                  onClick={handleBatchDelete}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: "#800000", color: "#fff" }}
                >
                  <Trash2 size={18} />
                  Delete
                </button>

              </div>
            </div>
          )}

          {mode === "upload" && (
            <>
              <div className="w-1/2">
                <p className="text-lg font-semibold mb-6 pb-3 border-b-2 border-gray-200" style={{ color: "#800000" }}>
                  Upload Excel File
                </p>

                <div
                  className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-4 bg-gradient-to-b from-gray-50 to-white transition-all hover:bg-gray-50"
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
                    className="cursor-pointer px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-md"
                    style={{ backgroundColor: "#fdcc03", color: "#000" }}
                  >
                    {file ? "Change File" : "Choose File"}
                  </label>
                  {file && <p className="text-sm text-gray-700 font-medium">✓ {file.name}</p>}
                  <p className="text-sm text-gray-500">Only .xls and .xlsx files supported</p>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || (uploadFor === "question" && !selectedOption)}
                className="px-12 py-3 rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#800000", color: "#fff" }}
              >
                {loading ? "Uploading..." : "Submit"}
              </button>
            </>
          )}
        </div>

      </div>
      )}
    </>
  );
};

export default ReusableUploadPage;