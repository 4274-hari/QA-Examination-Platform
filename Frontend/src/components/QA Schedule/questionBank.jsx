import axios from "axios";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const QuestionBank = () => {
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [loadingSubject, setLoadingSubject] = useState(null);

    const session = JSON.parse(
        sessionStorage.getItem("userSession") || "{}"
    );

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(
                "/api/main-backend/examiner/questions/subjects"
            );

            console.log("Subjects API response:", response.data);

            if (response.data.success) {
                const subjectsData = Array.isArray(response.data.data)
                    ? response.data.data.map((subject) => ({
                          ...subject,
                          topics: Array.isArray(subject.topics)
                              ? subject.topics
                              : [],
                      }))
                    : [];

                console.log("Processed subjects:", subjectsData);

                setSubjects(subjectsData);
            } else {
                setSubjects([]);

                Swal.fire({
                    icon: "error",
                    title: "Failed",
                    text:
                        response.data.message ||
                        "Unable to fetch subjects.",
                });
            }
        } catch (error) {
            console.error("Fetch subjects error:", error);

            setSubjects([]);

            Swal.fire({
                icon: "error",
                title: "Failed",
                text: "Unable to fetch subjects.",
            });
        }
    };

    const handleDownload = async (subjectName) => {
        try {
            setLoadingSubject(subjectName);

            const response = await axios.post(
                "/api/main-backend/examiner/questions/questionbank",
                {
                    subject_name: subjectName,
                },
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${subjectName}_Question_Bank.xlsx`;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error:", error);

            Swal.fire({
                icon: "error",
                title: "Download Failed",
                text: "Unable to download question bank.",
            });
        } finally {
            setTimeout(() => {
                setLoadingSubject(null);
            }, 100);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("userSession");
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-6">

                {/* Top Bar */}
                <div className="flex items-center justify-between mb-6">

                    {session?.role === "admin" ? (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm font-medium hover:text-[#800000]"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 qa-logout-btn px-3 py-2"
                    >
                        <Power size={16} />
                        Logout
                    </button>
                </div>

                {/* Heading */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-[#800000]">
                        Download Question Bank
                    </h2>

                    <p className="text-gray-600 mt-2">
                        Select a subject to download its Question Bank.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">

                    {subjects.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            No Subjects Found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="min-w-full">

                                {/* Table Header */}
                                <thead className="bg-gray-300">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold">
                                            S.No
                                        </th>

                                        <th className="px-6 py-4 text-left font-semibold">
                                            Subject Name
                                        </th>

                                        <th className="px-6 py-4 text-center font-semibold">
                                            Topics
                                        </th>

                                        <th className="px-6 py-4 text-center font-semibold">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody>
                                    {subjects.map((subject, index) => {

                                        // Extra safety
                                        const subjectName =
                                            subject?.subject_name || "Unknown Subject";

                                        const topics = Array.isArray(subject?.topics)
                                            ? subject.topics
                                            : [];

                                        return (
                                            <tr
                                                key={`${subjectName}-${index}`}
                                                className="border-t hover:bg-gray-50 transition"
                                            >

                                                {/* S.No */}
                                                <td className="px-6 py-5">
                                                    {index + 1}
                                                </td>

                                                {/* Subject Name */}
                                                <td className="px-6 py-5 font-medium">
                                                    {subjectName}
                                                </td>

                                                {/* Topics */}
                                                <td className="px-6 py-5 text-center">
                                                    {topics.length}
                                                </td>

                                                {/* Download */}
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleDownload(subjectName)
                                                        }
                                                        disabled={
                                                            loadingSubject === subjectName
                                                        }
                                                        className="
                                                            inline-flex
                                                            items-center
                                                            gap-2
                                                            bg-[#800000]
                                                            hover:bg-[#660000]
                                                            text-white
                                                            px-5
                                                            py-2.5
                                                            rounded-lg
                                                            transition
                                                            disabled:opacity-50
                                                            disabled:cursor-not-allowed
                                                        "
                                                    >
                                                        <Download size={18} />

                                                        {loadingSubject === subjectName
                                                            ? "Downloading..."
                                                            : "Download"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionBank;