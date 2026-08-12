 import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FormCss.css";

function PostQuestionForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    question: "",
    options: { A: "", B: "", C: "", D: "" },
    correctAnswer: "A",
  });
  const [responseMessage, setResponseMessage] = useState("");

  const handleQuestionChange = (e) => setFormData({ ...formData, question: e.target.value });
  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, options: { ...prev.options, [name]: value } }));
  };
  const handleCorrectAnswerChange = (e) => setFormData({ ...formData, correctAnswer: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://quizappbackend-k09m.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, topic: "General" }),
      });
      const data = await response.json();
      if (data.success) {
        setResponseMessage("✅ MCQ posted successfully!");
        setFormData({ question: "", options: { A: "", B: "", C: "", D: "" }, correctAnswer: "A" });
      } else {
        setResponseMessage(`❌ Error: ${data.message}`);
      }
    } catch {
      setResponseMessage("❌ Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/");
  };

  return (
    <div className="manage-container">
      <div className="ProperName">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => navigate("/manage-questions")}>📋 Manage Questions</button>
          <button onClick={() => navigate("/admin")}>⚙️ Exam Settings</button>
          <button onClick={handleLogout} style={{ backgroundColor: "#dc3545" }}>🚪 Logout</button>
        </div>
        <h2>Submit MCQ Question</h2>
        <form onSubmit={handleSubmit}>
          <label>Question:</label>
          <textarea value={formData.question} onChange={handleQuestionChange} required />
          {["A", "B", "C", "D"].map(opt => (
            <div key={opt}>
              <label>Option {opt}:</label>
              <input type="text" name={opt} value={formData.options[opt]} onChange={handleOptionChange} required />
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <label>Correct Answer:</label>
            <div>
              {["A", "B", "C", "D"].map(opt => (
                <label key={opt} style={{ marginRight: 15 }}>
                  <input type="radio" value={opt} checked={formData.correctAnswer === opt} onChange={handleCorrectAnswerChange} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={{ marginTop: 12 }}>Submit MCQ</button>
        </form>
        {responseMessage && <p>{responseMessage}</p>}
      </div>
    </div>
  );
}

export default PostQuestionForm;
