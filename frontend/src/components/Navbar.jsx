import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { saveApiKey, getApiKey } from "../services/api.js";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/screen", label: "Screen" },
  { to: "/chat", label: "Chat" },
  { to: "/analytics", label: "Analytics" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      getApiKey().then(({ data }) => {
        setHasKey(data.hasKey);
        setMaskedKey(data.maskedKey);
      }).catch(() => {});
    }
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
    setMenuOpen(false);
  }

  async function handleSaveKey(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveApiKey(apiKey);
      setHasKey(!!apiKey);
      setMaskedKey(apiKey.length > 4 ? "•".repeat(apiKey.length - 4) + apiKey.slice(-4) : apiKey);
      setApiKey("");
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowApiModal(false); }, 1500);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setShowApiModal(true)}
                  className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                  title="Set your Gemini API key"
                >
                   {hasKey ? <span className="text-green-400">Key set</span> : "Add API Key"}
                </button>
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
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-2 border-t border-gray-800 pt-4">
            {user && links.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`block text-sm px-2 py-1 ${pathname === to ? "text-indigo-400 font-semibold" : "text-gray-400"}`}>
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <button onClick={() => { setShowApiModal(true); setMenuOpen(false); }}
                  className="block text-sm text-gray-400 px-2 py-1">
                  🔑 {hasKey ? "API Key (set)" : "Add API Key"}
                </button>
                <p className="text-sm text-gray-400 px-2">Hi, <span className="text-white">{user.username}</span></p>
                <button onClick={handleLogout} className="block text-sm text-red-400 px-2 py-1">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-400 px-2 py-1">Sign in</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="block text-sm text-indigo-400 px-2 py-1">Sign up</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* API Key Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Gemini API Key</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your key is used for all AI features. It's stored securely and never shared.
              Get one free at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">aistudio.google.com</a>.
            </p>
            {hasKey && (
              <div className="bg-gray-800 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-300 font-mono">{maskedKey}</span>
                <span className="text-xs text-green-400">Active</span>
              </div>
            )}
            <form onSubmit={handleSaveKey} className="space-y-3">
              <input
                type="password"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder={hasKey ? "Enter new key to replace..." : "AIza..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="flex gap-3">
                <button type="submit" disabled={!apiKey || saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-semibold transition-all">
                  {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Key"}
                </button>
                {hasKey && (
                  <button type="button"
                    onClick={async () => { await saveApiKey(""); setHasKey(false); setMaskedKey(""); }}
                    className="px-4 py-2 bg-gray-800 hover:bg-red-900 text-red-400 rounded-xl text-sm transition-all">
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => setShowApiModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-sm transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
