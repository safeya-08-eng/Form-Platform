export function renderFieldInput(field, disabled = true) {
  const cfg = field.config || {};

  switch (field.field_type) {
    case "text":
      return <input type="text" placeholder={cfg.placeholder || ""} disabled={disabled} />;

    case "number":
      return (
        <input
          type="number"
          min={cfg.min ?? undefined}
          max={cfg.max ?? undefined}
          step={cfg.decimal ? "any" : 1}
          disabled={disabled}
        />
      );

    case "email":
      return <input type="email" placeholder={cfg.placeholder || ""} disabled={disabled} />;

    case "dropdown":
      return (
        <select disabled={disabled}>
          <option>Select an option</option>
          {(cfg.options || []).map((opt, i) => {
            const label = typeof opt === "string" ? opt : opt.label;
            return <option key={i}>{label}</option>;
          })}
        </select>
      );

    case "multi_checkbox":
      return (
        <div className="checkbox-group">
          {(cfg.options || []).map((opt, i) => {
            const label = typeof opt === "string" ? opt : opt.label;
            return (
              <label key={i} className="checkbox-row">
                <input type="checkbox" disabled={disabled} /> {label}
              </label>
            );
          })}
        </div>
      );

    case "date":
      return <input type="date" min={cfg.min_date} max={cfg.max_date} disabled={disabled} />;

    case "file":
      return (
        <div>
          <input type="file" disabled={disabled} />
          <div className="field-hint">
            {cfg.allowed_types?.length ? `Allowed: ${cfg.allowed_types.join(", ")}` : ""}
            {cfg.max_size_mb ? ` · Max ${cfg.max_size_mb}MB` : ""}
          </div>
        </div>
      );

    case "rating":
      return (
        <div className="rating-stars">
          {Array.from({ length: cfg.scale || 5 }).map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      );

    default:
      return <input type="text" disabled={disabled} />;
  }
}

export default function FormPreview({ title, description, fields }) {
  return (
    <div className="card preview">
      <h2>{title}</h2>
      {description && <p className="preview-desc">{description}</p>}
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
    </div>
  );
}
