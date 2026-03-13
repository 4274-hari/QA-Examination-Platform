import axios from "axios";
import { useEffect, useState } from "react";
import Banner from "../Banner";
import { ArrowLeft, Pause, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const ScheduledExam = () => {
  const [filters, setFilters] = useState({
    department: "",
    batch: "",
    time: "",
    regulation: "",
    academicYear: "",
    semester: "",
    date: "",
  });
  const [examData, setExamData] = useState([]);
  const navigate = useNavigate();

  const departments = [...new Set(examData.map(e => e.department))];
  const batches = [...new Set(examData.map(e => e.batch))];
  const regulation = [...new Set(examData.map(e => e.regulation))];
  const academicYears = [...new Set(examData.map(e => e.academic_year))];
  const semesters = [...new Set(examData.map(e => e.semester))];
  const [regNo, setRegNo] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePauseExam = async () => {
    if (!regNo) {
      Swal.fire({
        icon: "warning",
        title: "Missing Register Number",
        text: "Please enter a valid register number",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "api/main-backend/examiner/exam/pause",
        { registerno: regNo }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Exam Paused",
          text: `Student session paused successfully`,
          timer: 2000,
          showConfirmButton: false,
        });

        setRegNo("");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          error.response?.data?.message ||
          "Unable to pause exam session",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responce = await axios.get("/api/main-backend/examiner/exam-code");

        setExamData(responce.data.exams);
        
      } catch (error) {
        console.error("Error fetching QA Exam schedules", error);
      }
    }

    fetchData();
  }, [])

  const getTimeSlot = (timeStr) => {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes;

    return totalMinutes < 12 * 60 ? "Morning" : "Afternoon";
  };

  const filteredExams = examData?.filter((exam) => {
    const timeSlot = getTimeSlot(exam.start);

    return (
      (!filters.department || exam.department === filters.department) &&
      (!filters.batch || exam.batch === filters.batch) &&
      (!filters.time || filters.time === timeSlot) &&
      (!filters.regulation || exam.regulation === filters.regulation) &&
      (!filters.academicYear || exam.academic_year === filters.academicYear) &&
      (!filters.semester || exam.semester === filters.semester) &&
      (!filters.date || exam.date === filters.date)
    );
  });

  const handleCancel = async (scheduleId) => {
    const result = await Swal.fire({
      title: "Cancel Exam ?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.post(
        "/api/main-backend/examiner/exam-schedule/cancel",
        { scheduleId }
      );

      if (response.data.success) {
        // Update UI immediately
        setExamData((prev) =>
          prev.map((exam) =>
            exam.scheduleId === scheduleId
              ? { ...exam, status: "cancelled", examCode: null }
              : exam
          )
        );

        Swal.fire({
          title: "Cancelled!",
          text: "Exam schedule has been cancelled successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error cancelling exam schedule", error);

      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "Failed to cancel exam schedule",
        icon: "error",
      });
    }
  };

  const statusStyles = {
    active: "bg-green-100 text-green-700",
    scheduled: "bg-green-200 text-green-700",
    completed: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const session = JSON.parse(sessionStorage.getItem("userSession"));

  const showRegisterNumbers = (students = []) => {
  if (!Array.isArray(students) || students.length === 0) {
    Swal.fire({
      title: "No Students",
      text: "No register numbers available",
      icon: "info",
    });
    return;
  }

  Swal.fire({
    title: `Register Numbers (${students.length})`,
    width: 450,
    html: `
      <div style="
        max-height:350px;
        overflow-y:auto;
        text-align:left;
        font-family:monospace;
        padding:5px;
      ">
        ${students
          .map((reg, i) => `<div style="padding:4px 0">${i + 1}. ${reg}</div>`)
          .join("")}
      </div>
    `,
  });
};

  return (
    <>
    <Banner
      backgroundImage="./Banners/examsbanner.webp"
      headerText="office of controller of examinations"
      subHeaderText="COE"
    />
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
         <div className="flex flex-col gap-3 sm:gap-4 w-full mb-5">
            {/* Back button */}
            <div className="flex items-center justify-between">
              {session.role === "admin" ? (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : <div />}

              {/* Logout button */}
              <button
                onClick={() => {
                  sessionStorage.removeItem("userSession");
                  navigate("/");
                }}
                className="flex items-center gap-1 sm:gap-2 qa-logout-btn text-xs sm:text-sm px-2 sm:px-3 py-2 h-fit"
                title="Logout"
              >
                <Power size={14} className="sm:w-4 sm:h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Resume Exam Container */}
            <div className="flex flex-col gap-2 bg-white border border-[#800000]/30 rounded-xl px-3 sm:px-4 py-3 shadow-sm w-full md:w-fit md:mx-auto md:min-w-96">
              <div className="flex items-center justify-center">
                <span className="text-[#800000] text-xs sm:text-sm font-bold flex items-center gap-2 tracking-wide">
                  <Pause size={16} /> Resume Individual Student Exam
                </span>
              </div>
              <div className="gap-2 flex flex-col w-full">
                <input
                  type="number"
                  placeholder="Enter Register No"
                  className="
                    w-full
                    px-3 sm:px-4 py-2.5
                    text-xs sm:text-sm
                    font-medium
                    border-2 border-gray-300
                    rounded-lg
                    focus:border-[#800000]
                    focus:ring-2 focus:ring-[#800000]/30
                    shadow-inner
                  "
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />

                <button
                  onClick={handlePauseExam}
                  disabled={loading}
                  className={`
                    px-4 sm:px-5 py-2.5
                    rounded-lg
                    text-xs sm:text-sm font-semibold
                    text-white
                    bg-[#800000]
                    hover:bg-[#660000]
                    shadow-md
                    hover:shadow-lg
                    active:scale-95
                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    w-full
                  `}
                >
                  {loading ? "Resuming..." : "Resume Exam"}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-brwn whitespace-nowrap">
              Scheduled Exam
            </h1>
            {session.role === "admin" && (
              <button
                onClick={() => navigate('/scheduled-exam/history')}
                className="
                  inline-flex items-center gap-2
                  px-3 sm:px-4 py-2
                  rounded-lg
                  border border-[#800000]/30
                  bg-white
                  text-[#800000]
                  text-xs sm:text-sm font-medium
                  shadow-sm
                  hover:bg-[#800000]
                  hover:text-white
                  hover:border-[#800000]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-[#800000]/30
                "
              >
                View History
                <span className="text-base">→</span>
              </button>
            )}
          </div>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700">Filter Exams</h2>
            <button
              onClick={() => setFilters({
                department: "",
                batch: "",
                time: "",
                regulation: "",
                academicYear: "",
                semester: "",
                date: "",
              })}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <DateInput
            label="Date"
            value={filters.date}
            onChange={(v) => setFilters({ ...filters, date: v })}
          />

          <Select
            label="Regulation"
            options={regulation}
            value={filters.regulation}
            onChange={(v) => setFilters({ ...filters, regulation: v })}
          />

          <Select
            label="Academic Year"
            options={academicYears}
            value={filters.academicYear}
            onChange={(v) => setFilters({ ...filters, academicYear: v })}
          />

          <Select
            label="Semester"
            options={semesters}
            value={filters.semester}
            onChange={(v) => setFilters({ ...filters, semester: v })}
          />

          <Select
            label="Department"
            options={departments}
            value={filters.department}
            onChange={(v) => setFilters({ ...filters, department: v })}
          />

          <Select
            label="Batch"
            options={batches}
            value={filters.batch}
            onChange={(v) => setFilters({ ...filters, batch: v })}
          />

          <Select
            label="Time"
            options={["Morning", "Afternoon"]}
            value={filters.time}
            onChange={(v) => setFilters({ ...filters, time: v })}
          />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gry border-b">
              <tr>
                <TableHead>Department</TableHead>
                <TableHead className="w-36">Total Students</TableHead>
                <TableHead>Date</TableHead>
                {/* Mobile Exam Code */}
                <TableHead className="md:hidden">
                  Exam Code
                </TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>CIE</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Time</TableHead>
                {/* Laptop Exam Code */}
                <TableHead className="hidden md:table-cell">
                  Exam Code
                </TableHead>
                <TableHead>Status</TableHead>
                {session.role === "admin" && <TableHead>Action</TableHead>}
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={session.role === "admin" ? 9 : 8} className="text-center py-6 text-gray-500">
                    No exams found
                  </td>
                </tr>
              )}

              {filteredExams.map((exam) => (
                <tr
                  key={exam.scheduleId}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <TableCell>{exam.department}</TableCell>
                  <TableCell>
                    <span
                      onClick={() => showRegisterNumbers(exam.register_numbers)}
                      className="cursor-pointer text-black-600 hover:underline font-medium"
                    >
                      {exam.totalStudents}
                    </span>
                  </TableCell>
                  <TableCell>{exam.date}</TableCell>
                  {/* Mobile Exam Code */}
                  <TableCell className="md:hidden font-semibold">
                    {exam.examCode || "Will be scheduled"}
                  </TableCell>
                  <TableCell>{exam.batch}</TableCell>
                  <TableCell>{exam.cie}</TableCell>
                  <TableCell>{Array.isArray(exam.subject) ? exam.subject.join("/") : exam.subject}</TableCell>
                  <TableCell>{exam.start} - {exam.end}</TableCell>
                  {/* Laptop Exam Code */}
                  <TableCell className="hidden md:table-cell font-semibold">
                    {exam.examCode || "Will be scheduled"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[exam.status]}`}
                    >
                      {exam.status}
                    </span>
                  </TableCell>
                  {session.role === "admin" && (
                    <TableCell>
                        <button
                          onClick={() => handleCancel(exam.scheduleId)}
                          disabled={exam.status === "cancelled"}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            exam.status === "cancelled"
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          Cancel
                        </button>
                    </TableCell>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-right">
          Showing {filteredExams.length} exams
        </p>
      </div>
    </div>
    </>
  );
}

/* Reusable Components */

function DateInput({ label, value, onChange }) {
  return (
    <div className="relative">
      <input
        type="date"
        className="w-full p-2.5 border rounded-md bg-prim text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Select ${label}`}
      />
      {value && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Clear date"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <select
      className="w-full p-2.5 border rounded-md bg-prim text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{`All ${label}`}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TableHead({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 font-semibold text-text ${className}`}>
      {children}
    </th>
  );
}

function TableCell({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-gray-700 ${className}`}>
      {children}
    </td>
  );
}

export default ScheduledExam;