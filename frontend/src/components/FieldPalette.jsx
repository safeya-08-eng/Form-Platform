export default function FieldPalette({ fieldTypes, onAdd, disabled }) {
  return (
    <div className="card palette">
      <h3>Field Types</h3>
      <p className="palette-hint">Click a type to add it to the form.</p>
      <div className="palette-grid">
        {fieldTypes.map((ft) => (
          <button
            key={ft.type}
            className="palette-card"
            disabled={disabled}
            onClick={() => onAdd(ft)}
            title={`Add a ${ft.label} field`}
          >
            {ft.label}
          </button>
        ))}
      </div>
    </div>
  );
}
