import { Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import FormBuilder from "./pages/FormBuilder.jsx";
import PublicForm from "./pages/PublicForm.jsx";

function NavBar() {
  const location = useLocation();
  if (location.pathname.startsWith("/f/")) return null; // public pages have no admin nav

  return (
    <nav className="navbar">
      <div className="navbar-brand">Form Platform</div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/forms/:formId" element={<FormBuilder />} />
          <Route path="/f/:token" element={<PublicForm />} />
        </Routes>
      </main>
    </div>
  );
}
