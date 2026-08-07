  import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminConfig from "./components/AdminConfig";
import ManageQuestions from "./components/ManageQuestions";
import PostQuestionForm from "./components/QuestionSubmittingForm";   // adjust name if needed
import AdminLogin from "./components/Protection";
import ArchivedQuizzes from "./components/ArchivedQuizzes";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminConfig />} />
        <Route path="/manage-questions" element={<ManageQuestions />} />
        <Route path="/post-question" element={<PostQuestionForm />} />
        <Route path="/" element={<AdminLogin/>} />
        <Route path="/admin-login" element={<AdminLogin/>}></Route>
        <Route path="/archived-quizzes" element={<ArchivedQuizzes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
