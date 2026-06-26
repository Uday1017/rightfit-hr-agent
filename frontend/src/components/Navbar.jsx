import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/screen", label: "Screen" },
  { to: "/chat", label: "Chat" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
    setOpen(false);
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-400">RightFit</Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {user && links.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`text-sm ${pathname === to ? "text-indigo-400 font-semibold" : "text-gray-400 hover:text-white"}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-400">Hi, <span className="text-white font-medium">{user.username}</span></span>
              <button onClick={handleLogout} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-all">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-400 hover:text-white">Sign in</Link>
              <Link to="/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-4 space-y-3 pb-2 border-t border-gray-800 pt-4">
          {user && links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`block text-sm px-2 py-1 ${pathname === to ? "text-indigo-400 font-semibold" : "text-gray-400"}`}>
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <p className="text-sm text-gray-400 px-2">Hi, <span className="text-white">{user.username}</span></p>
              <button onClick={handleLogout} className="block text-sm text-red-400 px-2 py-1">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-sm text-gray-400 px-2 py-1">Sign in</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block text-sm text-indigo-400 px-2 py-1">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
