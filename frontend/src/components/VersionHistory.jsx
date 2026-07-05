const STATUS_COLORS = {
  published: "badge-green",
  archived: "badge-red",
};

export default function VersionHistory({ versions }) {
  if (versions.length === 0) {
    return <p className="empty-state">No published versions yet.</p>;
  }

  return (
    <div className="version-list">
      {versions.map((v) => (
        <div key={v.id} className="version-row">
          <span className="version-number">v{v.version_number}</span>
          <span className="version-title">{v.title}</span>
          <span className={`badge ${STATUS_COLORS[v.status] || "badge-gray"}`}>{v.status}</span>
          <span className="version-date">
            {new Date(v.published_at).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
