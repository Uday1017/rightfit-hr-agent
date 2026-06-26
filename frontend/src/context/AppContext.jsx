import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("rf_user");
    return u ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("rf_token") || null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [candidates, setCandidates] = useState([]);
  const [jobDescription, setJobDescription] = useState("");

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("rf_user", JSON.stringify(userData));
    localStorage.setItem("rf_token", jwt);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("rf_user");
    localStorage.removeItem("rf_token");
  }

  return (
    <AppContext.Provider value={{ user, token, login, logout, sessionId, candidates, setCandidates, jobDescription, setJobDescription }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
