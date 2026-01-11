import React, { useEffect, useState, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import LoadComp from "./components/LoadComp.jsx";
import AptitudeHeader from "./components/QA Student/AptitudeHeader.jsx";

/* Lazy Loaded Pages */
const StudentLoginPage = React.lazy(() =>
  import("./components/QA Student/StudentLoginPage.jsx")
);
const InstructionPage = React.lazy(() =>
  import("./components/QA Student/Approve.jsx")
);
const QuestionPage = React.lazy(() =>
  import("./components/QA Student/questions.jsx")
);
const Schedule = React.lazy(() =>
  import("./components/QA Schedule/Schedule/Schedule.jsx")
);
const UploadContainer = React.lazy(() =>
  import("./components/QA Schedule/uploads/uploadContainer.jsx")
);
const QAExamResults = React.lazy(() =>
  import("./components/QA Schedule/qaExamResult.jsx")
);
const ScheduledExam = React.lazy(() =>
  import("./components/QA Schedule/scheduledExam.jsx")
);

const App = () => {

  /* ---------------- Offline Handling ---------------- */
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadComp txt="You are offline" />
      </div>
    );
  }

  return (
    <>
      <AptitudeHeader />

      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <LoadComp />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<StudentLoginPage />} />
          <Route path="/QA/confirm" element={<InstructionPage />} />
          <Route path="/QA/questions" element={<QuestionPage />} />

          <Route path="/staff-dashboard" element={<Schedule />} />
          <Route path="/upload" element={<UploadContainer />} />
          <Route path="/scheduled-exam" element={<ScheduledExam />} />
          <Route path="/qaresult" element={<QAExamResults />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;