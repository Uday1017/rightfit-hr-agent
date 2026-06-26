import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Screen from "./pages/Screen.jsx";
import Candidate from "./pages/Candidate.jsx";
import Chat from "./pages/Chat.jsx";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/screen" element={<ProtectedRoute><Screen /></ProtectedRoute>} />
          <Route path="/candidate/:id" element={<ProtectedRoute><Candidate /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
