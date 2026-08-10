import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ArchivedQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState(false); // for UI feedback

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = () => {
    setLoading(true);
    fetch("https://quizappbackend-k09m.onrender.com")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setQuizzes(data.quizzes);
        } else {
          setError(data.message || "Failed to load archived quizzes.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Network error: " + err.message);
        setLoading(false);
      });
  };

  // Download functions
  const downloadCsv = (quizName, type) => {
    let url;
    switch (type) {
      case "results":
        url = `/admin/archived-csv/${encodeURIComponent(quizName)}`;
        break;
      case "registrations":
        url = `/admin/archived-registrations-csv/${encodeURIComponent(quizName)}`;
        break;
      case "questions":
        url = `/admin/archived-questions-csv/${encodeURIComponent(quizName)}`;
        break;
      default:
        return;
    }
    window.open(`https://ascent-halt-glorify.ngrok-free.dev${url}`, "_blank");
  };

  // Delete a single quiz
  const deleteQuiz = async (quizName) => {
    if (!window.confirm(`Are you sure you want to delete the archived quiz "${quizName}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(
        `https://quizappbackend-k09m.onrender.com/${encodeURIComponent(quizName)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        setQuizzes((prev) => prev.filter((q) => q.quizName !== quizName));
        setError("");
      } else {
        setError(data.message || "Failed to delete quiz.");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Delete all archived quizzes
  const deleteAllQuizzes = async () => {
    if (!window.confirm("Are you sure you want to delete ALL archived quizzes? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch("https://quizappbackend-k09m.onrender.com", { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setQuizzes([]);
        setError("");
      } else {
        setError(data.message || "Failed to delete all quizzes.");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) =>
    q.quizName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1100, margin: "30px auto", padding: 20 }}>
      <h2>📜 Past Quizzes (Archived)</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back to Admin
        </button>
        {quizzes.length > 0 && (
          <button
            className="btn btn-danger"
            onClick={deleteAllQuizzes}
            disabled={deleting}
            style={{ marginLeft: 10 }}
          >
            🗑️ Delete All
          </button>
        )}
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="text"
          placeholder="🔍 Search by quiz name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />
        {searchTerm && (
          <button className="btn btn-secondary" onClick={() => setSearchTerm("")}>
            Clear
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {filteredQuizzes.length === 0 ? (
            <p>{quizzes.length === 0 ? "No archived quizzes found." : `No quiz matches "${searchTerm}".`}</p>
          ) : (
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Quiz Name</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Start Time (IST)</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>End Time (IST)</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Duration (min)</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>Attempts</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((q) => {
                  const start = new Date(q.startTime);
                  const end = new Date(q.endTime);
                  return (
                    <tr key={q.quizName}>
                      <td style={{ padding: 10, border: "1px solid #ddd" }}>{q.quizName}</td>
                      <td style={{ padding: 10, border: "1px solid #ddd" }}>
                        {start.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </td>
                      <td style={{ padding: 10, border: "1px solid #ddd" }}>
                        {end.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </td>
                      <td style={{ padding: 10, border: "1px solid #ddd" }}>{q.durationMinutes}</td>
                      <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>{q.count}</td>
                      <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => downloadCsv(q.quizName, "results")}
                            disabled={deleting}
                          >
                            📊 Results
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => downloadCsv(q.quizName, "registrations")}
                            disabled={deleting}
                          >
                            📋 Registrations
                          </button>
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => downloadCsv(q.quizName, "questions")}
                            disabled={deleting}
                          >
                            📝 Questions
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteQuiz(q.quizName)}
                            disabled={deleting}
                            style={{ background: "#dc3545", borderColor: "#dc3545" }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {filteredQuizzes.length > 0 && (
            <div style={{ marginTop: 10, color: "#666" }}>
              Showing {filteredQuizzes.length} of {quizzes.length} quizzes
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ArchivedQuizzes;
