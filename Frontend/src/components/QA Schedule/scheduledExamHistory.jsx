import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Banner from "../Banner";

const ScheduledExamHistory = () => {
  const [filters, setFilters] = useState({
    department: "",
    batch: "",
    time: "",
    regulation: "",
    academicYear: "",
    semester: "",
    status: "",
    date: "",
  });
  const [examData, setExamData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const tableTopRef = useRef(null);
  const navigate = useNavigate();

  const departments = [...new Set(examData.map(e => e.department))];
  const batches = [...new Set(examData.map(e => e.batch))];
  const regulation = [...new Set(examData.map(e => e.regulation))];
  const academicYears = [...new Set(examData.map(e => e.academic_year))];
  const semesters = [...new Set(examData.map(e => e.semester))];
  const status = [...new Set(examData.map(e => e.status))];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responce = await axios.get("/api/main-backend/examiner/exam-code/history");

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
      (!filters.status || exam.status === filters.status) &&
      (!filters.date || exam.date === filters.date)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExams = filteredExams.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const statusStyles = {
    active: "bg-green-100 text-green-700",
    scheduled: "bg-green-200 text-green-700",
    completed: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const session = JSON.parse(sessionStorage.getItem("userSession"));

  const scrollToTableTop = () => {
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
    <Banner 
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
          </div>
          <div className="text-center mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-brwn whitespace-nowrap">
              Scheduled Exam History
            </h1>
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
                status: "",
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
            label="Status"
            options={status}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
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
        <div ref={tableTopRef} className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gry border-b">
              <tr>
                <TableHead>Department</TableHead>
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
              </tr>
            </thead>
            <tbody>
              {paginatedExams.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No exams found
                  </td>
                </tr>
              )}

              {paginatedExams.map((exam) => (
                <tr
                  key={exam.scheduleId}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <TableCell>{exam.department}</TableCell>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info and Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredExams.length)} of {filteredExams.length} exams
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  scrollToTableTop();
                }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          scrollToTableTop();
                        }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#800000] text-white"
                            : "bg-white border hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  scrollToTableTop();
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
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

export default ScheduledExamHistory;