 import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://quizappbackend-k09m.onrender.com";

function AdminConfig() {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(true);

  const [config, setConfig] = useState({
    startTime: "",
    durationMinutes: 0,
    positiveMarks: 0,
    negativeMarks: 0,
    quizName: "",
    registrationFields: {},
    registrationOpen: true,
  });
  const [fields, setFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");
  const [serverTime, setServerTime] = useState(null);
  const [quizStatus, setQuizStatus] = useState({
    isQuizOpen: false,
    hasEnded: false,
    startTime: null,
    endTime: null,
    durationMinutes: 0,
    ranksFinalised: false,
  });
  const [pollingActive, setPollingActive] = useState(true);
  const intervalRef = useRef(null);

  const [prevQuizName, setPrevQuizName] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(true);

  // Load configuration on mount
  useEffect(() => {
    fetch(`${API_BASE}/admin/config`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const c = data.config;
          setConfig({
            startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : "",
            durationMinutes: c.durationMinutes ?? 0,
            positiveMarks: c.positiveMarks ?? 0,
            negativeMarks: c.negativeMarks ?? 0,
            quizName: c.quizName || "",
            registrationFields: c.registrationFields || {},
            registrationOpen: c.registrationOpen ?? true,
          });
          setRegistrationOpen(c.registrationOpen ?? true);
          setPrevQuizName(c.quizName || "");
          const fieldArray = Object.entries(c.registrationFields || {}).map(
            ([name, { enabled, required }]) => ({
              id: name,
              name,
              enabled: enabled ?? true,
              required: required ?? false,
            })
          );
          setFields(fieldArray);
        }
      });
  }, []);

  // Poll server time and quiz status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!pollingActive) return;
      try {
        const [timeRes, statusRes] = await Promise.all([
          fetch(`${API_BASE}/servertime`),
          fetch(`${API_BASE}/quiz-status`),
        ]);
        const timeData = await timeRes.json();
        const statusData = await statusRes.json();
        setServerTime(timeData);
        setQuizStatus(statusData);
      } catch (err) {
        // ignore
      }
    };
    fetchStatus();
    if (pollingActive) {
      intervalRef.current = setInterval(fetchStatus, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollingActive]);

  // Field handlers
  const toggleEnabled = (id) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const changeRequired = (id, value) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, required: value === "required" } : f))
    );
  };

  const deleteField = (id) => {
    if (window.confirm(`Delete field "${id}"?`)) {
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const startEdit = (id) => {
    const f = fields.find((f) => f.id === id);
    if (f) {
      setEditingId(id);
      setEditingName(f.name);
    }
  };

  const saveEdit = () => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      alert("Field name cannot be empty.");
      return;
    }
    if (fields.some((f) => f.id !== editingId && f.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Field "${trimmed}" already exists.`);
      return;
    }
    setFields((prev) =>
      prev.map((f) =>
        f.id === editingId ? { ...f, name: trimmed, id: trimmed } : f
      )
    );
    setEditingId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const addField = () => {
    const trimmed = newFieldName.trim();
    if (!trimmed) {
      alert("Please enter a field name.");
      return;
    }
    if (fields.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Field "${trimmed}" already exists.`);
      return;
    }
    setFields((prev) => [
      ...prev,
      {
        id: trimmed,
        name: trimmed,
        enabled: true,
        required: newFieldRequired,
      },
    ]);
    setNewFieldName("");
    setNewFieldRequired(false);
  };

  // Submit configuration
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isQuizNameChanged = config.quizName !== prevQuizName;

    const registrationFields = {};
    fields.forEach(({ name, enabled, required }) => {
      registrationFields[name] = { enabled, required };
    });

    const payload = {
      startTime: new Date(config.startTime).toISOString(),
      durationMinutes: parseInt(config.durationMinutes),
      positiveMarks: parseFloat(config.positiveMarks),
      negativeMarks: parseFloat(config.negativeMarks),
      quizName: config.quizName,
      registrationFields,
      isQuizNameChanged,
      registrationOpen: registrationOpen, // send toggle state
    };

    const res = await fetch(`${API_BASE}/admin/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setPrevQuizName(config.quizName);
      setMessage("✅ Configuration updated!");
      setPollingActive(true);
      setTimeout(() => navigate("/manage-questions"), 1500);
    } else {
      setMessage("❌ Update failed: " + data.message);
    }
  };

  // Reset config (local only – does not clear CSV files)
  const handleResetConfig = () => {
    if (!window.confirm("Reset ALL configuration to blank/default values? This will clear the quiz name, start time, marks, and extra fields. (CSV files will NOT be touched.)")) return;

    setConfig({
      startTime: "",
      durationMinutes: 0,
      positiveMarks: 0,
      negativeMarks: 0,
      quizName: "",
      registrationFields: {},
      registrationOpen: true,
    });
    setRegistrationOpen(true);
    setFields([]);
    setMessage("🔄 Configuration reset to blank.");

    setQuizStatus({
      isQuizOpen: false,
      hasEnded: false,
      startTime: null,
      endTime: null,
      durationMinutes: 0,
      ranksFinalised: false,
    });
    setPollingActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Clear current CSV (for this quiz)
  const handleClearCsv = async () => {
    if (!window.confirm("Delete the current results CSV file? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/clear-csv`, { method: "DELETE" });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Clear CSV failed: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin-login");
  };

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 20 }}>
      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => navigate("/manage-questions")}>
            📝 Manage Questions
          </button>
          <button className="btn btn-info" onClick={() => navigate("/archived-quizzes")}>
            📜 View Past Quizzes
          </button>
          {/* NEW: Download Live Registration CSV button */}
          <button
            className="btn btn-success"
            onClick={() => window.open(`${API_BASE}/registrations-csv`, '_blank')}
          >
            📥 Download Registrations (Live)
          </button>
        </div>
        <button className="btn btn-danger" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Server Time & Quiz Status */}
      <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}>
        <h4 style={{ marginTop: 0 }}>🕒 Server Status</h4>
        {serverTime && (
          <div style={{ marginBottom: "5px" }}>
            <strong>Server Time (IST):</strong> {serverTime.serverTimeIST}
          </div>
        )}
        {quizStatus && (
          <div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Active Quiz Name:</strong> <span style={{ color: "#0066b3", fontWeight: "bold" }}>{prevQuizName || "Not Set"}</span>
            </div>
            <div>
              <strong>Quiz Status:</strong>{" "}
              <span style={{ color: quizStatus.isQuizOpen ? "green" : quizStatus.hasEnded ? "red" : "orange" }}>
                {quizStatus.isQuizOpen ? "🟢 Open" : quizStatus.hasEnded ? "🔴 Ended" : "🟡 Waiting"}
              </span>
            </div>
            <div>
              <strong>Start:</strong> {quizStatus.startTime ? new Date(quizStatus.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"}
            </div>
            <div>
              <strong>End:</strong> {quizStatus.endTime ? new Date(quizStatus.endTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"}
            </div>
            <div>
              <strong>Duration:</strong> {quizStatus.durationMinutes} min
            </div>
            <div>
              <strong>Ranks Finalised:</strong> {quizStatus.ranksFinalised ? "✅ Yes" : "❌ No"}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Configuration */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        style={{
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          padding: "8px 20px",
          borderRadius: "4px",
          fontSize: "1rem",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        {showConfig ? "▲ Hide Configuration" : "▼ Show Configuration"}
      </button>

      {showConfig && (
        <>
          <h2 style={{ color: "#000000" }}>⚙️ Master Exam Configuration</h2>

          <form onSubmit={handleSubmit}>
            {/* Quiz Name */}
            <div className="form-group">
              <label className="form-label">Quiz Name</label>
              <input
                type="text"
                name="quizName"
                value={config.quizName}
                onChange={(e) => setConfig((prev) => ({ ...prev, quizName: e.target.value }))}
                required
                className="form-control"
              />
              <small className="form-hint" style={{ color: "#ffff" }}>Changing this will delete all existing questions and reset CSVs.</small>
            </div>

            {/* NEW: Registration Open/Close Toggle */}
            <div className="form-group">
              <label className="form-label">Registration Status</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: registrationOpen ? "green" : "red", fontWeight: "bold" }}>
                  {registrationOpen ? "🟢 Open" : "🔴 Closed"}
                </span>
                <button
                  type="button"
                  className={`btn ${registrationOpen ? "btn-danger" : "btn-success"}`}
                  onClick={() => setRegistrationOpen(!registrationOpen)}
                >
                  {registrationOpen ? "Close Registration" : "Open Registration"}
                </button>
              </div>
              <small className="form-hint" style={{ color: "#ffff" }}>
                When closed, new students cannot register for the quiz.
              </small>
            </div>

            {/* Start Time */}
            <div className="form-group">
              <label className="form-label">Start Time (IST)</label>
              <input
                type="datetime-local"
                name="startTime"
                value={config.startTime}
                onChange={(e) => setConfig((prev) => ({ ...prev, startTime: e.target.value }))}
                required
                className="form-control"
              />
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input
                type="number"
                name="durationMinutes"
                value={config.durationMinutes}
                onChange={(e) => setConfig((prev) => ({ ...prev, durationMinutes: parseFloat(e.target.value) }))}
                required
                min="1"
                className="form-control"
              />
            </div>

            {/* Positive Marks */}
            <div className="form-group">
              <label className="form-label">Positive Marks per Question</label>
              <input
                type="number"
                name="positiveMarks"
                value={config.positiveMarks}
                onChange={(e) => setConfig((prev) => ({ ...prev, positiveMarks: parseFloat(e.target.value) }))}
                required
                min="0"
                step="0.5"
                className="form-control"
              />
              <small className="form-hint" style={{ color: "#ffff" }}>Marks for correct answer</small>
            </div>

            {/* Negative Marks */}
            <div className="form-group">
              <label className="form-label">Negative Marks per Question</label>
              <input
                type="number"
                name="negativeMarks"
                value={config.negativeMarks}
                onChange={(e) => setConfig((prev) => ({ ...prev, negativeMarks: parseFloat(e.target.value) }))}
                required
                min="0"
                step="0.5"
                className="form-control"
              />
              <small className="form-hint" style={{ color: "#ffff" }}>Penalty for wrong answer</small>
            </div>

            <h3 style={{ color: "#ffff" }}>Extra Registration Fields</h3>

            {/* Fixed fields */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#fff" }}>Fixed Fields (always present)</div>
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                <li style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#ffff", minWidth: "120px", fontWeight: "bold" }}>Name</span>
                  <span style={{ color: "#ffff" }}>✅ Enabled</span>
                  <span style={{ color: "#ffff" }}>🔒 Required</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#ffff", minWidth: "120px", fontWeight: "bold" }}>Email</span>
                  <span style={{ color: "#ffff" }}>✅ Enabled</span>
                  <span style={{ color: "#ffff" }}>🔒 Required</span>
                </li>
              </ul>
            </div>

            {/* Extra fields list */}
            {fields.length === 0 ? (
              <p style={{ color: "#888" }}>No extra fields defined.</p>
            ) : (
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {fields.map((field) => (
                  <li
                    key={field.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px 0",
                      borderBottom: "1px solid #eee",
                      flexWrap: "wrap",
                    }}
                  >
                    {editingId === field.id ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          style={{ flex: "1", minWidth: "120px" }}
                          className="form-control"
                        />
                        <button type="button" className="btn btn-success btn-sm" onClick={saveEdit}>
                          Save
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ minWidth: "120px", fontWeight: "bold", color: "#fff" }}>{field.name}</span>
                        <label style={{ color: "#fff" }}>
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={() => toggleEnabled(field.id)}
                          />
                          Enabled
                        </label>
                        <select
                          value={field.required ? "required" : "optional"}
                          onChange={(e) => changeRequired(field.id, e.target.value)}
                          disabled={!field.enabled}
                          style={{ padding: "2px 6px" }}
                          className="form-control"
                        >
                          <option value="required">Required</option>
                          <option value="optional">Optional</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => startEdit(field.id)}
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteField(field.id)}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add new field */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="New field name (e.g., city, school)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="form-control"
                style={{ flex: "1", minWidth: "150px" }}
              />
              <select
                value={newFieldRequired ? "required" : "optional"}
                onChange={(e) => setNewFieldRequired(e.target.value === "required")}
                className="form-control"
                style={{ padding: "4px 6px" }}
              >
                <option value="optional">Optional</option>
                <option value="required">Required</option>
              </select>
              <button type="button" className="btn btn-primary" onClick={addField}>
                Add Field
              </button>
            </div>
            <br />

            <button type="submit" className="btn btn-success" style={{ marginRight: 10 }}>
              💾 Save Configuration
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleResetConfig}
            >
              🗑️ Reset All Config (blank)
            </button>
          </form>

          {message && <p style={{ marginTop: 15, color: message.includes("✅") ? "green" : "red" }}>{message}</p>}
        </>
      )}
    </div>
  );
}

export default AdminConfig;
