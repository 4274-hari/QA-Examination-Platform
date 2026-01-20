import axios from "axios";
import { useEffect, useState } from "react";
import Banner from "../Banner";
import { ArrowLeft, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const ScheduledExam = () => {
  const [filters, setFilters] = useState({
    department: "",
    batch: "",
    time: "",
  });
  const [examData, setExamData] = useState([]);
  const navigate = useNavigate();

  const departments = [...new Set(examData.map(e => e.department))];
  const batches = [...new Set(examData.map(e => e.batch))];

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
      (!filters.time || filters.time === timeSlot)
    );
  });

  const handleCancel = async (scheduleId) => {
    const result = await Swal.fire({
      title: "Cancel Exam?",
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

  return (
    <>
    <Banner
      backgroundImage="./Banners/examsbanner.webp"
      headerText="office of controller of examinations"
      subHeaderText="COE"
    />
    <div className="min-h-screen bg-gray-100 p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
         <div className="flex items-center justify-between w-full px-4 mt-4 mb-5">
            {/* Back button */}
            {session.role === "admin" ? (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-medium"
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
              className="flex items-center ml-4 qa-logout-btn"
              title="Logout"
            >
              <Power size={16} />
              Logout
            </button>
          </div>
          <div className="text-center mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-brwn whitespace-nowrap">
              Today's Exam Schedule
            </h1>
          </div>
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Select
            label="Department"
            options={departments}
            value={filters.department}
            onChange={(v) => setFilters({ ...filters, department: v })}
          />

          <Select
            label="Year"
            options={batches}
            value={filters.batch  }
            onChange={(v) => setFilters({ ...filters, year: v })}
          />

          <Select
            label="Time"
            options={["Morning", "Afternoon"]}
            value={filters.time}
            onChange={(v) => setFilters({ ...filters, time: v })}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gry border-b">
              <tr>
                <TableHead>Department</TableHead>
                {/* Mobile Exam Code */}
                <TableHead className="md:hidden">
                  Exam Code
                </TableHead>
                {/* <TableHead>Year</TableHead> */}
                <TableHead>CIE</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
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
                  {/* Mobile Exam Code */}
                  <TableCell className="md:hidden font-semibold">
                    {exam.examCode || "Will be scheduled"}
                  </TableCell>
                  {/* <TableCell>{exam.year}</TableCell> */}
                  <TableCell>{exam.cie}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.subjectCode}</TableCell>
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