import axios from "axios";
import { useEffect, useState } from "react";
import Banner from "../Banner";
import { ArrowLeft, Pause, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const UserPauseExam = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
         <div className="flex flex-col gap-3 sm:gap-4 w-full mb-5">
            {/* Back button */}
            <div className="flex items-center justify-end">

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
      </div>
    </div>
    </>
  );
}



export default UserPauseExam;