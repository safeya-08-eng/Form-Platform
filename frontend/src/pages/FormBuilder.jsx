import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getForm, updateForm, getFieldTypes, addField, updateField, deleteField,
  reorderFields, publishForm, archiveForm, listVersions, generateLink,
} from "../api/client.js";
import FieldPalette from "../components/FieldPalette.jsx";
import FieldList from "../components/FieldList.jsx";
import FormPreview from "../components/FormPreview.jsx";
import VersionHistory from "../components/VersionHistory.jsx";

const STATUS_COLORS = { draft: "badge-gray", published: "badge-green", archived: "badge-red" };

export default function FormBuilder() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'publish' | 'archive'
  const [shareLink, setShareLink] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  const load = useCallback(() => {
    getForm(formId).then((res) => setForm(res.data)).catch(() => setError("Failed to load form."));
    listVersions(formId).then((res) => setVersions(res.data)).catch(() => {});
  }, [formId]);

  useEffect(() => {
    getFieldTypes().then((res) => setFieldTypes(res.data)).catch(() => setError("Failed to load field types."));
    load();
  }, [load]);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!form) return <div className="page">Loading...</div>;

  const locked = !form.is_editable;

  const handleTitleBlur = (e) => {
    const title = e.target.value;
    if (title !== form.title) updateForm(formId, { title }).then(() => load());
  };

  const handleDescBlur = (e) => {
    const description = e.target.value;
    if (description !== form.description) updateForm(formId, { description }).then(() => load());
  };

  const handleAddField = (fieldType) => {
    addField(formId, {
      field_type: fieldType.type,
      label: `New ${fieldType.label} Field`,
      is_required: false,
      config: {},
    })
      .then(() => load())
      .catch((e) => setError(e.response?.data?.detail || "Failed to add field."));
  };

  const handleUpdateField = (fieldId, data) => {
    updateField(formId, fieldId, data).then(() => load()).catch((e) =>
      setError(e.response?.data?.detail || "Failed to update field.")
    );
  };

  const handleDeleteField = (fieldId) => {
    if (!window.confirm("Delete this field?")) return;
    deleteField(formId, fieldId).then(() => load());
  };

  const handleReorder = (orderedIds) => {
    reorderFields(formId, orderedIds).then(() => load());
  };

  const runConfirmedAction = async () => {
    try {
      if (confirmAction === "publish") await publishForm(formId);
      if (confirmAction === "archive") await archiveForm(formId);
      setConfirmAction(null);
      setShareLink(null);
      load();
    } catch (e) {
      setError(e.response?.data?.detail || "Action failed.");
      setConfirmAction(null);
    }
  };

  const handleGenerateLink = () => {
    generateLink(formId)
      .then((res) => setShareLink(res.data))
      .catch((e) => setError(e.response?.data?.detail || "Publish the form first."));
  };

  const handleCopy = () => {
    const url = `${window.location.origin}${shareLink.path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 1500);
    });
  };

  return (
    <div className="page">
      <button className="btn btn-link" onClick={() => navigate("/")}>← Back to Dashboard</button>

      <div className="builder-header card">
        <div className="builder-header-top">
          <input
            className="title-input"
            defaultValue={form.title}
            onBlur={handleTitleBlur}
            disabled={locked}
          />
          <span className={`badge ${STATUS_COLORS[form.status]}`}>{form.status}</span>
        </div>
        <textarea
          className="desc-input"
          defaultValue={form.description}
          onBlur={handleDescBlur}
          disabled={locked}
          placeholder="Form description..."
        />

        <div className="builder-actions">
          <button className="btn" onClick={() => setPreviewMode((p) => !p)}>
            {previewMode ? "Back to Editor" : "Preview Form"}
          </button>
          <button className="btn" onClick={() => setShowVersions((v) => !v)}>
            {showVersions ? "Hide Versions" : "Version History"} ({versions.length})
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setConfirmAction("publish")}
            disabled={locked}
          >
            Publish
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setConfirmAction("archive")}
            disabled={form.status === "archived"}
          >
            Archive
          </button>
          <button className="btn" onClick={handleGenerateLink}>
            Get Shareable Link
          </button>
        </div>

        {shareLink && (
          <div className="share-link-box">
            <code>{window.location.origin}{shareLink.path}</code>
            <button className="btn btn-sm" onClick={handleCopy}>
              {copyStatus || "Copy"}
            </button>
          </div>
        )}
      </div>

      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal card">
            <h3>
              {confirmAction === "publish" ? "Publish this form?" : "Archive this form?"}
            </h3>
            <p>
              {confirmAction === "publish"
                ? "This freezes the current fields into a new version respondents can submit against."
                : "Archiving locks the form completely — no further edits or publishes will be possible."}
            </p>
            <div className="field-config-actions">
              <button className="btn btn-primary btn-sm" onClick={runConfirmedAction}>
                Confirm
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showVersions && (
        <div className="card">
          <h3>Version History</h3>
          <VersionHistory versions={versions} />
        </div>
      )}

      {previewMode ? (
        <FormPreview title={form.title} description={form.description} fields={form.fields} />
      ) : (
        <div className="builder-layout">
          <FieldPalette fieldTypes={fieldTypes} onAdd={handleAddField} disabled={locked} />
          <div className="builder-canvas">
            <h3>Form Fields</h3>
            <FieldList
              fields={form.fields}
              fieldTypes={fieldTypes}
              disabled={locked}
              onReorder={handleReorder}
              onUpdate={handleUpdateField}
              onDelete={handleDeleteField}
            />
          </div>
        </div>
      )}
    </div>
  );
}
