import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FieldConfigForm from "./FieldConfigForm.jsx";

function SortableRow({ field, fieldTypeDef, editing, onEdit, onCancelEdit, onSave, onDelete, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="field-row card">
      <div className="field-row-header">
        <span
          className={`drag-handle ${disabled ? "disabled" : ""}`}
          {...(disabled ? {} : { ...attributes, ...listeners })}
          title={disabled ? "Locked (archived form)" : "Drag to reorder"}
        >
          ⠿
        </span>
        <div className="field-row-meta">
          <strong>{field.label}</strong>
          <span className="field-type-tag">{fieldTypeDef?.label || field.field_type}</span>
          {field.is_required && <span className="badge badge-gray">required</span>}
        </div>
        <div className="field-row-actions">
          <button className="btn btn-sm" onClick={() => onEdit(field.id)} disabled={disabled}>
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(field.id)}
            disabled={disabled}
          >
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <FieldConfigForm
          fieldTypeDef={fieldTypeDef}
          initial={field}
          onSave={(data) => onSave(field.id, data)}
          onCancel={onCancelEdit}
        />
      )}
    </div>
  );
}

export default function FieldList({ fields, fieldTypes, disabled, onReorder, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const typeMap = Object.fromEntries(fieldTypes.map((ft) => [ft.type, ft]));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const newOrder = arrayMove(fields, oldIndex, newIndex).map((f) => f.id);
    onReorder(newOrder);
  };

  if (fields.length === 0) {
    return <p className="empty-state">No fields yet. Add one from the palette on the left.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="field-list">
          {fields.map((field) => (
            <SortableRow
              key={field.id}
              field={field}
              fieldTypeDef={typeMap[field.field_type]}
              editing={editingId === field.id}
              disabled={disabled}
              onEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              onSave={(id, data) => {
                onUpdate(id, data);
                setEditingId(null);
              }}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
