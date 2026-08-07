import axios from "axios";
import { useEffect, useState } from "react";
import Banner from "../Banner";
import { ArrowLeft, Download, Power } from "lucide-react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

const QuestionBank = () => {
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [loadingSubject, setLoadingSubject] = useState(null);;

    const session = JSON.parse(sessionStorage.getItem("userSession"));

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(
                "/api/main-backend/examiner/questions/subjects"
            );

            if (response.data.success) {
                setSubjects(response.data.data);
            }
        } catch (error) {
            console.error(error);

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
            console.error(error);

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

    return (
        <>
            {/* <Banner
                backgroundImage="./Banners/examsbanner.webp"
                headerText="office of controller of examinations"
                subHeaderText="COE"
            /> */}

            <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-6xl mx-auto px-6">

                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6">
                        {session.role === "admin" ? (
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
                            onClick={() => {
                                sessionStorage.removeItem("userSession");
                                navigate("/");
                            }}
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

                                    <tbody>
                                        {subjects.map((subject, index) => (
                                            <tr
                                                key={subject.subject_name}
                                                className="border-t hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-5">
                                                    {index + 1}
                                                </td>

                                                <td className="px-6 py-5 font-medium">
                                                    {subject.subject_name}
                                                </td>

                                                <td className="px-6 py-5 text-center">
                                                    {subject.topics.length}
                                                </td>

                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleDownload(subject.subject_name)
                                                        }
                                                        disabled={loadingSubject === subject.subject_name}
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
                      "
                                                    >
                                                        <Download size={18} />
                                                        Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default QuestionBank;