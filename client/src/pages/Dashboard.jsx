import React from "react";
import { useAuth } from "../context/AuthContext";
import { useWebRTC } from "../hooks/useWebRTC";
import SessionHistory from "../components/SessionHistory";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeUsers, setActiveUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const { socket, sendChat, messages, sendFiles, progress } = useWebRTC(selectedUser);

  // Load active users
  React.useEffect(() => {
    if (!socket) return;
    socket.on("presence:update", (users) => setActiveUsers(users));
    socket.emit("presence:list");
  }, [socket]);

  // Handle file selection
  function handleFileChange(e) {
    sendFiles(e.target.files);
  }

  // Handle drag & drop
  function handleDrop(e) {
    e.preventDefault();
    sendFiles(e.dataTransfer.files);
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Welcome, {user?.username}</h2>
        <button onClick={logout} style={{ marginBottom: "1rem" }}>
          Logout
        </button>
        <h3>Active Users</h3>
        <ul>
          {activeUsers
            .filter((u) => u.id !== user?.id)
            .map((u) => (
              <li key={u.id} onClick={() => setSelectedUser(u)}>
                {u.username}
              </li>
            ))}
        </ul>
        <SessionHistory />
      </aside>

      <main className="main">
        <div
          className="chat-box"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`message ${
                m.system
                  ? "system"
                  : m.self
                  ? "self"
                  : "other"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                sendChat(e.target.value);
                e.target.value = "";
              }
            }}
          />
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-input"
          />
          <label htmlFor="file-input" style={{ cursor: "pointer", padding: "0.75rem", background: "#38bdf8", color: "#fff" }}>
            📎
          </label>
        </div>
        {Object.entries(progress).map(([id, pct]) => (
          <div key={id} className="file-progress">
            <div
              className="file-progress-bar"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        ))}
      </main>
    </div>
  );
}
