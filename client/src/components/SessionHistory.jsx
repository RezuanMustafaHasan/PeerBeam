import React from "react";
import { useAuth } from "../context/AuthContext";

export default function SessionHistory() {
  const { token, user } = useAuth();
  const [sessions, setSessions] = React.useState([]);

  React.useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/history/my-sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {});
  }, [token]);

  return (
    <div style={{ marginTop: "1rem" }}>
      <h4>Recent Sessions</h4>
      <ul className="list">
        {sessions.map((s) => {
          const me = user?.id;
          const peers = (s.users || []).filter((u) => u._id !== me);
          const peerNames = peers.map((p) => p.username).join(", ");
          const start = new Date(s.acceptedAt || s.startedAt).toLocaleString();
          const end = s.endedAt ? new Date(s.endedAt).toLocaleString() : "active";
          return (
            <li key={s._id}>
              <div>
                <strong>{peerNames || "Session"}</strong>
              </div>
              <div>Start: {start}</div>
              <div>End: {end}</div>
              {Array.isArray(s.files) && s.files.length > 0 && (
                <div>
                  <em>Files:</em>
                  <ul>
                    {s.files.map((f, i) => (
                      <li key={i}>
                        {f.name} — {(f.size / 1024 / 1024).toFixed(2)} MB
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
