import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listForms, createForm } from "../api/client.js";

const STATUS_COLORS = {
  draft: "badge-gray",
  published: "badge-green",
  archived: "badge-red",
};

export default function Dashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    listForms()
      .then((res) => setForms(res.data))
      .catch(() => setError("Could not load forms. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await createForm({ title, description });
      navigate(`/forms/${res.data.id}`);
    } catch {
      setError("Failed to create form.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Your Forms</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate((s) => !s)}>
          + Create New Form
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <form className="card create-form" onSubmit={handleCreate}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit">Create & Open Builder</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : forms.length === 0 ? (
        <p className="empty-state">No forms yet. Create your first form to get started.</p>
      ) : (
        <div className="form-grid">
          {forms.map((f) => (
            <div key={f.id} className="card form-card" onClick={() => navigate(`/forms/${f.id}`)}>
              <div className="form-card-header">
                <h3>{f.title}</h3>
                <span className={`badge ${STATUS_COLORS[f.status]}`}>{f.status}</span>
              </div>
              <p className="form-card-desc">{f.description || "No description"}</p>
              <div className="form-card-meta">{f.field_count} field{f.field_count !== 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
