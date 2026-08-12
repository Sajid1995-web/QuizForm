 import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";

function ManageQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: { A: "", B: "", C: "", D: "" },
    correctAnswer: "A",
    imageUrl: "",
    imageFile: null,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const adminKey = localStorage.getItem("adminKey") || "supersecret";

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ---------- FETCH QUESTIONS ----------
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/questions`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setMessage("");
      } else {
        setMessage("❌ " + (data.message || "Failed to load questions"));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage(`❌ Cannot reach server.`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- HANDLE INPUT CHANGE ----------
  const handleChange = (e, isEdit = false) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      if (isEdit) {
        setEditing({ ...editing, imageFile: file, imageUrl: "" });
      } else {
        setNewQuestion({ ...newQuestion, imageFile: file, imageUrl: "" });
      }
      return;
    }

    if (name.startsWith("option_")) {
      const opt = name.split("_")[1];
      if (isEdit) {
        setEditing({ ...editing, options: { ...editing.options, [opt]: value } });
      } else {
        setNewQuestion({ ...newQuestion, options: { ...newQuestion.options, [opt]: value } });
      }
      return;
    }

    if (isEdit) {
      setEditing({ ...editing, [name]: value });
    } else {
      setNewQuestion({ ...newQuestion, [name]: value });
    }
  };

  // ---------- ADD SINGLE QUESTION (DRAFT) ----------
  const handleAdd = async (e) => {
    e.preventDefault(); // prevent accidental Enter key submission
    setLoading(true);
    const formData = new FormData();
    formData.append("question", newQuestion.question);
    formData.append("correctAnswer", newQuestion.correctAnswer);
    formData.append("options", JSON.stringify(newQuestion.options));
    if (newQuestion.imageFile) {
      formData.append("image", newQuestion.imageFile);
    } else if (newQuestion.imageUrl) {
      formData.append("imageUrl", newQuestion.imageUrl);
    }

    try {
      const res = await fetch(`${API_BASE}/post-question`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ " + (data.message || "Question added as draft!"));
        setNewQuestion({
          question: "",
          options: { A: "", B: "", C: "", D: "" },
          correctAnswer: "A",
          imageUrl: "",
          imageFile: null,
        });
        fetchQuestions();
      } else {
        setMessage("❌ Failed: " + data.message);
      }
    } catch (err) {
      setMessage("❌ Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- EDIT MODE ----------
  const handleEdit = (q) => {
    setEditing({ ...q, imageFile: null });
  };

  // ---------- UPDATE SINGLE QUESTION ----------
  const handleUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("question", editing.question);
    formData.append("correctAnswer", editing.correctAnswer);
    formData.append("options", JSON.stringify(editing.options));
    if (editing.imageFile) {
      formData.append("image", editing.imageFile);
    } else if (editing.imageUrl !== undefined) {
      formData.append("imageUrl", editing.imageUrl);
    }

    try {
      const res = await fetch(`${API_BASE}/update-question/${editing._id}`, {
        method: "PUT",
        headers: { "x-admin-key": adminKey },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Question updated!");
        setEditing(null);
        fetchQuestions();
      } else {
        setMessage("❌ Update failed: " + data.message);
      }
    } catch (err) {
      setMessage("❌ Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- DELETE QUESTION ----------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delete-question/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Question deleted");
        fetchQuestions();
      } else {
        setMessage("❌ Delete failed: " + data.message);
      }
    } catch (err) {
      setMessage("❌ Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- PUBLISH ALL QUESTIONS ----------
  const handlePublishAll = async () => {
    if (!window.confirm("Publish ALL questions? They will become visible to students.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/publish-questions`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        fetchQuestions();
      } else {
        setMessage("❌ Publish failed: " + data.message);
      }
    } catch (err) {
      setMessage("❌ Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- LOGOUT ----------
  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin-login");
  };

  // ---------- RENDER ----------
  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/admin")}>← Back to Config</button>
        <button onClick={handleLogout} style={{ backgroundColor: "#dc3545" }}>🚪 Logout</button>
      </div>

      <h2>Manage Questions</h2>
      {loading && <p>⏳ Loading...</p>}
      {message && <p style={{ color: message.includes("✅") ? "green" : "red" }}>{message}</p>}

      {/* Add new question form */}
      <div style={{ border: "1px solid #ccc", padding: 20, marginBottom: 30 }}>
        <h3>Add New Question (Draft)</h3>
        <form
          onSubmit={handleAdd}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        >
          <input
            name="question"
            placeholder="Question text"
            value={newQuestion.question}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <input
              name="imageUrl"
              placeholder="Image URL (optional)"
              value={newQuestion.imageUrl}
              onChange={handleChange}
              style={{ flex: 1 }}
            />
            <span>OR</span>
            <input
              type="file"
              name="imageFile"
              accept="image/*"
              onChange={handleChange}
              style={{ flex: 1 }}
            />
          </div>
          {newQuestion.imageFile && (
            <p style={{ fontSize: 14, color: "#666" }}>Selected file: {newQuestion.imageFile.name}</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {["A", "B", "C", "D"].map(opt => (
              <input
                key={opt}
                name={`option_${opt}`}
                placeholder={`Option ${opt}`}
                value={newQuestion.options[opt]}
                onChange={handleChange}
                required
              />
            ))}
          </div>
          <select
            name="correctAnswer"
            value={newQuestion.correctAnswer}
            onChange={handleChange}
            style={{ marginBottom: 10 }}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
          <br />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              backgroundColor: "#0066b3",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Add Question (Draft)
          </button>
        </form>
      </div>

      {/* List of existing questions */}
      <h3>Existing Questions</h3>
      {questions.length === 0 && <p>No questions yet.</p>}
      {questions.map((q) => (
        <div key={q._id} style={{ border: "1px solid #eee", padding: 15, marginBottom: 15, borderRadius: 5 }}>
          {editing && editing._id === q._id ? (
            // Edit mode
            <div>
              <input
                name="question"
                value={editing.question}
                onChange={(e) => handleChange(e, true)}
                style={{ width: "100%", marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <input
                  name="imageUrl"
                  value={editing.imageUrl}
                  onChange={(e) => handleChange(e, true)}
                  placeholder="Image URL (or upload file below)"
                  style={{ flex: 1 }}
                />
                <span>OR</span>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={(e) => handleChange(e, true)}
                  style={{ flex: 1 }}
                />
              </div>
              {editing.imageFile && (
                <p style={{ fontSize: 14, color: "#666" }}>Selected file: {editing.imageFile.name}</p>
              )}
              {editing.imageUrl && !editing.imageFile && (
                <img
                  src={`${API_BASE}${editing.imageUrl}`}
                  alt="preview"
                  style={{ maxWidth: "100px", maxHeight: "80px", marginBottom: 10 }}
                />
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {["A", "B", "C", "D"].map(opt => (
                  <input
                    key={opt}
                    name={`option_${opt}`}
                    value={editing.options[opt]}
                    onChange={(e) => handleChange(e, true)}
                    required
                  />
                ))}
              </div>
              <select
                name="correctAnswer"
                value={editing.correctAnswer}
                onChange={(e) => handleChange(e, true)}
                style={{ marginBottom: 10 }}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              <div>
                <button onClick={handleUpdate} style={{ background: "#28a745" }} disabled={loading}>
                  Save
                </button>
                <button onClick={() => setEditing(null)} style={{ marginLeft: 10 }} disabled={loading}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Display mode
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: "bold" }}>{q.question}</div>
                <div>
                  <span style={{
                    backgroundColor: q.published ? "#22c55e" : "#f59e0b",
                    color: "#fff",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}>
                    {q.published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              {q.imageUrl && (
                <img
                  src={`${API_BASE}${q.imageUrl}`}
                  alt="question"
                  style={{ maxWidth: "200px", maxHeight: "150px", margin: "5px 0", objectFit: "contain" }}
                />
              )}
              <div style={{ margin: "5px 0" }}>
                {["A", "B", "C", "D"].map(opt => (
                  <span key={opt} style={{ marginRight: 15 }}>
                    {opt}: {q.options[opt]}
                  </span>
                ))}
              </div>
              <div>Correct: {q.correctAnswer}</div>
              <div style={{ marginTop: 10 }}>
                <button onClick={() => handleEdit(q)} disabled={loading}>✎ Edit</button>
                <button
                  onClick={() => handleDelete(q._id)}
                  style={{ backgroundColor: "#dc3545", color: "#fff", marginLeft: 10 }}
                  disabled={loading}
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Publish All button */}
      {questions.length > 0 && (
        <div style={{ marginTop: 30, textAlign: "center", borderTop: "1px solid #ddd", paddingTop: 20 }}>
          <button
            onClick={handlePublishAll}
            disabled={loading}
            style={{
              padding: "12px 32px",
              backgroundColor: "#0066b3",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📢 Publish All Questions
          </button>
          <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            This will make all current questions visible to students during the quiz.
          </p>
        </div>
      )}
    </div>
  );
}

export default ManageQuestions;
