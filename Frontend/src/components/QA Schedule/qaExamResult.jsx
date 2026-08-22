import axios from "axios";
import { useEffect, useState } from "react";
import Banner from "../Banner";
import { ArrowLeft, FileSpreadsheet, Power, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const QAExamResults = () => {
  const [activeTab, setActiveTab] = useState("results");

  return (
    <>
      {activeTab === "results" ? (
        <ExamResultsView setActiveTab={setActiveTab} />
      ) : (
        <DownloadStudentResultView setActiveTab={setActiveTab} />
      )}
    </>
  );
};

const ExamResultsView = ({ setActiveTab }) => {
  const [filters, setFilters] = useState({
    cie: "",
    batch: "",
    examtype: "",
    department: "",
    semester: "",
    regulation: "",
    academicYear: "",
  });

  const [resultData, setResultData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/main-backend/examiner/forms')
        setBatches(res.data.batch)
        setDepartments(res.data.departments)
        setSemesters(res.data.semesters)
        setRegulations(res.data.regulation)
        setAcademicYears(res.data.academic_year)
      } catch (error) {
        console.error("Error fetching the form data",error);
      }
    }
    fetchData();
  }, [])

  const handleFetchResults = async () => {
    if (!filters.batch || !filters.regulation || !filters.academicYear) {
      Swal.fire({
        title: "Missing Filters",
        text: "Please select Batch, Regulation, and Academic Year",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    const cieMap = {
      "CIE I": "cie1",
      "CIE II": "cie2",
      "CIE III": "cie3",
    };

    // ✅ build payload
    const payload = {
      batch: filters.batch,
      regulation: filters.regulation,
      academic_year: filters.academicYear,
    };

    // ✅ optional fields
    if (filters.cie) payload.cie = cieMap[filters.cie];
    if (filters.department) payload.department = filters.department;
    if (filters.examtype) payload.exam_type = filters.examtype;
    if (filters.semester) payload.semester = filters.semester;

    try {
      const response = await axios.post(
        "/api/main-backend/examiner/results/export",
        payload
      );

      if (response.data.results && response.data.results.length > 0) {
        setResultData(response.data.results);
        Swal.fire({
          title: "Success",
          text: "Results fetched successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        setFilters({
          cie: "",
          batch: "",
          examtype: "",
          department: "",
          semester: "",
          regulation: "",
          academicYear: "",
        });
      } else {
        setResultData([]);
        setFilters({
          cie: "",
          batch: "",
          examtype: "",
          department: "",
          semester: "",
          regulation: "",
          academicYear: "",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch exam results",
        icon: "error",
      });
      setFilters({
          cie: "",
          batch: "",
          examtype: "",
          department: "",
          semester: "",
          regulation: "",
          academicYear: "",
      });
    }

    setLoading(false);
  };

  return (
    <>
      <Banner
        backgroundImage="./Banners/examsbanner.webp"
        headerText="office of controller of examinations"
        subHeaderText="COE"
      />

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <button
              className="flex gap-2 justify-center items-center text-gray-700 hover:text-black"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h1 className="text-2xl font-bold text-brwn mb-0">
              Exam Results
            </h1>

            <div className="flex gap-3 items-center">
              <button
                className="px-4 py-1 border border-[#800000] text-[#800000] rounded-lg font-medium hover:bg-[#800000] hover:text-white transition flex items-center gap-2 text-sm"
                onClick={() => setActiveTab("download")}
                title="Student Results"
                type="button"
              >
                <FileText size={18} />
                <span>Student Results</span>
              </button>

              <button
                className="qa-logout-btn"
                onClick={() => {
                  sessionStorage.removeItem("userSession");
                  navigate("/");
                }}
                title="Log out"
                type="button"
              >
                <Power size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Select
              label="Regulation"
              options={regulations}
              value={filters.regulation}
              onChange={(v) =>
                setFilters({ ...filters, regulation: v })
              }
            />

            <Select
              label="Academic Year"
              options={academicYears}
              value={filters.academicYear}
              onChange={(v) =>
                setFilters({ ...filters, academicYear: v })
              }
            />

            <Select
              label="Batch"
              options={batches}
              value={filters.batch}
              onChange={(v) =>
                setFilters({ ...filters, batch: v })
              }
            />

            <Select
              label="CIE"
              options={["CIE I", "CIE II", "CIE III"]}
              value={filters.cie}
              onChange={(v) =>
                setFilters({ ...filters, cie: v })
              }
            />


            <Select
              label="Exam Type"
              options={["Regular", "Retest", "Arrear"]}
              value={filters.examtype}
              onChange={(v) =>
                setFilters({ ...filters, examtype: v })
              }
            />

            {(!filters.examtype || filters.examtype === "Regular") && (
              <Select
                label="Department"
                options={departments}
                value={filters.department}
                onChange={(v) =>
                  setFilters({ ...filters, department: v })
                }
              />
            )}

            <Select
              label="Semester"
              options={semesters}
              value={filters.semester}
              onChange={(v) =>
                setFilters({ ...filters, semester: v })
              }
            />

            <button
              className="px-4 py-2 bg-secd text-text rounded-md text-sm font-medium hover:bg-brwn hover:text-prim"
              onClick={handleFetchResults}
              disabled={loading}
            >
              {loading ? "Getting..." : "Get Results"}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gry border-b">
                <tr>
                  <TableHead>S.No</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </thead>

              <tbody>
                {resultData.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-6 text-gray-500"
                    >
                      No results found
                    </td>
                  </tr>
                )}

                {resultData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.department || (item.isArrear && "Arrear") || (item.isRetest && "Re-Test")}</TableCell>
                    <TableCell>{item.total_students}</TableCell>
                    <TableCell>{Array.isArray(item.subject) ? item.subject.join("/") : item.subject}</TableCell>
                    <TableCell>{item.cie}</TableCell>
                    <TableCell>{item.semester}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <a href={item.excel_link} className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs w-fit font-medium cursor-pointer flex items-center" ><FileSpreadsheet size={16} /></a>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-right">
            Showing {resultData.length} result file(s)
          </p>
        </div>
      </div>
    </>
  );
};

const DownloadStudentResultView = ({ setActiveTab }) => {
  const [filters, setFilters] = useState({
    registerno: "",
    cie: "",
    batch: "",
    examtype: "",
    department: "",
    semester: "",
    regulation: "",
    academicYear: "",
  });

  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // State to hold dynamically fetched register numbers (Array of objects)
  const [registerNumbers, setRegisterNumbers] = useState([]);

  const navigate = useNavigate();

  // Fetch Initial Dropdown Options
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/main-backend/examiner/forms");
        setBatches(res.data.batch);
        setDepartments(res.data.departments);
        setSemesters(res.data.semesters);
        setRegulations(res.data.regulation);
        setAcademicYears(res.data.academic_year);
      } catch (error) {
        console.error("Error fetching the form data", error);
      }
    };
    fetchData();
  }, []);

  // Fetch Register Numbers when Department and Batch are selected
  useEffect(() => {
    const fetchRegisterNumbers = async () => {
      if (filters.department && filters.batch) {
        try {
          const res = await axios.post(
            "/api/main-backend/examiner/forms/register-number",
            {
              department: filters.department,
              batch: filters.batch,
            },
          );
          setRegisterNumbers(res.data.students || []);
        } catch (error) {
          console.error("Error fetching register numbers", error);
          setRegisterNumbers([]);
        }
      } else {
        setRegisterNumbers([]);
      }
    };

    fetchRegisterNumbers();

    // Reset the selected register number if the list changes
    setFilters((prev) => ({ ...prev, registerno: "" }));
  }, [filters.department, filters.batch]);

  const handleDownloadResult = async () => {
    if (!filters.registerno || !filters.cie || !filters.batch) {
      Swal.fire({
        title: "Missing Details",
        text: "Please enter Register No, Batch, and select a CIE.",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    const cieMap = {
      "CIE I": "cie1",
      "CIE II": "cie2",
      "CIE III": "cie3",
    };

    const payload = {
      registerno: filters.registerno,
      batch: filters.batch,
      regulation: filters.regulation,
      academic_year: filters.academicYear,
      semester: filters.semester,
      department: filters.department,
      cie: cieMap[filters.cie] || filters.cie,
      isRetest: filters.examtype === "Retest",
      isArrear: filters.examtype === "Arrear",
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") {
        delete payload[key];
      }
    });

    try {
      const response = await fetch(
        "/api/main-backend/examiner/students/examresult",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const textData = await response.text();
        let errorMessage = "Failed to download PDF";
        try {
          const errorData = JSON.parse(textData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Keep default
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Build dynamic filename from filters and replace spaces with underscores
      const category = filters.examtype || "Normal";
      const sem = filters.semester || "Sem";
      const year = filters.academicYear || "Year";
      const fileName =
        `${filters.registerno}_${filters.cie}_${category}_${sem}_${year}_Result.pdf`.replace(
          /\s+/g,
          "_",
        );

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: "Success",
        text: "Result PDF downloaded successfully!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to download exam result",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Banner
        backgroundImage="./Banners/examsbanner.webp"
        headerText="office of controller of examinations"
        subHeaderText="COE"
      />

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <button
              className="flex gap-2 justify-center items-center text-gray-700 hover:text-black"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h1 className="text-2xl font-bold text-brwn mb-0">
              Download Student Result
            </h1>

            <div className="flex gap-3 items-center">
              <button
                className="px-4 py-1 border border-[#800000] text-[#800000] rounded-lg font-medium hover:bg-[#800000] hover:text-white transition flex items-center gap-2 text-sm"
                onClick={() => setActiveTab("results")}
                title="Exam Results"
                type="button"
              >
                <FileText size={18} />
                <span>Exam Results</span>
              </button>

              <button
                className="qa-logout-btn flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 px-3 py-1 rounded-md transition-colors"
                onClick={() => {
                  sessionStorage.removeItem("userSession");
                  navigate("/");
                }}
                title="Log out"
                type="button"
              >
                <Power size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

              {/* NEW: Searchable Custom Select for Students */}
              <SearchableSelect
                label="Student (Reg No / Name)"
                options={registerNumbers}
                value={filters.registerno}
                onChange={(v) => setFilters({ ...filters, registerno: v })}
                disabled={registerNumbers.length === 0}
              />

              <Select
                label="Regulation"
                options={regulations}
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
                label="CIE"
                options={["CIE I", "CIE II", "CIE III"]}
                value={filters.cie}
                onChange={(v) => setFilters({ ...filters, cie: v })}
              />

              <Select
                label="Exam Type"
                options={["Regular", "Retest", "Arrear"]}
                value={filters.examtype}
                onChange={(v) => setFilters({ ...filters, examtype: v })}
              />

              <Select
                label="Semester"
                options={semesters}
                value={filters.semester}
                onChange={(v) => setFilters({ ...filters, semester: v })}
              />
            </div>

            {/* Action Button Section */}
            <div className="flex justify-center mt-4 pt-4 border-t border-gray-100">
              <button
                className="px-6 py-2.5 bg-secd text-text rounded-md text-sm font-medium hover:bg-brwn hover:text-prim flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                onClick={handleDownloadResult}
                disabled={loading}
              >
                {loading ? (
                  "Generating PDF..."
                ) : (
                  <>
                    <Download size={18} /> Download Result PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================
   NEW: Custom Searchable Dropdown Component
   ========================================= */
function SearchableSelect({ label, options, value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Keep the input string in sync with the selected value when closed
  useEffect(() => {
    if (!isOpen) {
      if (value) {
        const selectedOpt = options.find((opt) => opt.registerno === value);
        if (selectedOpt) {
          setSearchTerm(`${selectedOpt.registerno} - ${selectedOpt.name}`);
        } else {
          setSearchTerm(value);
        }
      } else {
        setSearchTerm("");
      }
    }
  }, [value, options, isOpen]);

  // Filter options based on Register No OR Name
  const filteredOptions = options.filter((opt) => {
    const search = searchTerm.toLowerCase();
    return (
      opt.registerno?.toLowerCase().includes(search) ||
      opt.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="relative w-full">
      <input
        type="text"
        className="w-full p-2.5 border rounded-md bg-prim text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 placeholder-gray-500"
        placeholder={
          disabled ? "Select Dept & Batch First" : `Search ${label}...`
        }
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (e.target.value === "") onChange(""); // Reset value if cleared
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay so click registers
        disabled={disabled}
      />

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg left-0">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={opt.registerno || index}
                className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-b-0"
                onClick={() => {
                  onChange(opt.registerno);
                  setSearchTerm(`${opt.registerno} - ${opt.name}`);
                  setIsOpen(false);
                }}
              >
                <span className="font-semibold text-gray-800">
                  {opt.registerno}
                </span>
                <span className="text-gray-500 ml-2">- {opt.name}</span>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500 text-center">
              No matching students
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* =========================================
   Existing Standard Select Component
   ========================================= */
function Select({ label, options, value, onChange }) {
  return (
    <select
      className="w-full p-2.5 border rounded-md bg-prim text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{`Select ${label}`}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-4 py-3 font-semibold text-text">
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

export default QAExamResults;