import { useState } from "react";

function PropertyInput({ prop, value, onChange }) {
  if (prop.type === "boolean") {
    return (
      <label className="prop-row checkbox-row">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {prop.label}
      </label>
    );
  }

  if (prop.type === "list") {
    const text = Array.isArray(value) ? value.join("\n") : "";
    return (
      <label className="prop-row">
        {prop.label}
        <textarea
          placeholder="One option per line"
          value={text}
          onChange={(e) =>
            onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))
          }
        />
      </label>
    );
  }

  if (prop.type === "number") {
    return (
      <label className="prop-row">
        {prop.label}
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      </label>
    );
  }

  if (prop.type === "date") {
    return (
      <label className="prop-row">
        {prop.label}
        <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  // default: text
  return (
    <label className="prop-row">
      {prop.label}
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function FieldConfigForm({ fieldTypeDef, initial, onSave, onCancel }) {
  const [label, setLabel] = useState(initial.label);
  const [isRequired, setIsRequired] = useState(initial.is_required);
  const [config, setConfig] = useState(initial.config || {});

  const setProp = (name, value) => setConfig((c) => ({ ...c, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ label, is_required: isRequired, config });
  };

  return (
    <form className="field-config-form" onSubmit={handleSubmit}>
      <label className="prop-row">
        Label
        <input value={label} onChange={(e) => setLabel(e.target.value)} required />
      </label>

      <label className="prop-row checkbox-row">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
        Required field
      </label>

      {fieldTypeDef?.properties?.map((prop) => (
        <PropertyInput
          key={prop.name}
          prop={prop}
          value={config[prop.name]}
          onChange={(v) => setProp(prop.name, v)}
        />
      ))}

      <div className="field-config-actions">
        <button type="submit" className="btn btn-primary btn-sm">Save</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
