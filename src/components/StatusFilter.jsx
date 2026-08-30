export default function StatusFilter({ statuses, selected, onSelect }) {
  return (
    <div className="status-filter">
      {statuses.map((status) => (
        <button
          key={status.id}
          className={`status-btn focusable-item ${selected === status.id ? 'active' : ''}`}
          onClick={() => onSelect(status.id)}
          tabIndex={0}
        >
          <span>{status.name}</span>
          {status.count > 0 && <span className="check">({status.count})</span>}
        </button>
      ))}
    </div>
  );
}