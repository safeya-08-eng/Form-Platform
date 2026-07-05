import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicForm } from "../api/client.js";
import { renderFieldInput } from "../components/FormPreview.jsx";

export default function PublicForm() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicForm(token)
      .then((res) => setData(res.data))
      .catch(() => setError("This form link is invalid or has expired."));
  }, [token]);

  if (error) return <div className="page public-page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <div className="page public-page">Loading...</div>;

  const fields = [...data.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="page public-page">
      <div className="card preview public-form-card">
        <h1>{data.form_title}</h1>
        {data.form_description && <p className="preview-desc">{data.form_description}</p>}

        {data.form_status === "archived" && (
          <div className="alert alert-error">
            This form is no longer accepting responses.
          </div>
        )}

        <div className="preview-fields">
          {fields.map((field) => (
            <div key={field.id} className="preview-field">
              <label>
                {field.label}
                {field.is_required && <span className="required-star"> *</span>}
              </label>
              {renderFieldInput(field, true)}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" disabled title="Submissions arrive in Milestone 2">
          Submit (coming in Milestone 2)
        </button>
        <div className="version-tag">Form version v{data.version_number}</div>
      </div>
    </div>
  );
}
