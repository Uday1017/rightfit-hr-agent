import { createContext, useContext, useState } from "react";
const AppContext = createContext();

export function AppProvider({ children }) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [candidates, setCandidates] = useState([]);
  const [jobDescription, setJobDescription] = useState("");

  return (
    <AppContext.Provider value={{ sessionId, candidates, setCandidates, jobDescription, setJobDescription }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
