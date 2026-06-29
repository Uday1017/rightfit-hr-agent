import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("rf_user");
    return u ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("rf_token") || null);

  // sessionId stored per user: rf_session_{userId}
  const [sessionId, setSessionId] = useState(() => {
    const u = localStorage.getItem("rf_user");
    if (!u) return null;
    const { id } = JSON.parse(u);
    return localStorage.getItem(`rf_session_${id}`) || null;
  });

  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobDescription, setJobDescription] = useState("");

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("rf_user", JSON.stringify(userData));
    localStorage.setItem("rf_token", jwt);
    // restore last active session for this user
    const saved = localStorage.getItem(`rf_session_${userData.id}`);
    setSessionId(saved || null);
  }

  function logout() {
    setUser(null);
    setToken(null);
    setSessionId(null);
    setCandidates([]);
    setSessions([]);
    localStorage.removeItem("rf_user");
    localStorage.removeItem("rf_token");
  }

  function switchSession(sid) {
    setSessionId(sid);
    setCandidates([]);
    setJobDescription("");
    if (user) localStorage.setItem(`rf_session_${user.id}`, sid);
  }

  return (
    <AppContext.Provider value={{
      user, token, login, logout,
      sessionId, switchSession,
      sessions, setSessions,
      candidates, setCandidates,
      jobDescription, setJobDescription
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
