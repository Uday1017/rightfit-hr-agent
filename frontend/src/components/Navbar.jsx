import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/screen", label: "Screen" },
  { to: "/chat", label: "Chat" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-8">
      <Link to="/" className="text-xl font-bold text-indigo-400">RightFit</Link>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className={`text-sm ${pathname === to ? "text-indigo-400 font-semibold" : "text-gray-400 hover:text-white"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
