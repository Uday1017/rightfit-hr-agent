import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { loginUser } from "../services/api.js";

export default function Login() {
  const { login, user } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return navigate("/dashboard");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to your <span className="text-indigo-400">RightFit</span> account</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
