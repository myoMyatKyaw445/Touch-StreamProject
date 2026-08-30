export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="category-filter">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`category-btn focusable-item ${selected === cat.id ? 'active' : ''}`}
          onClick={() => onSelect(cat.id)}
          tabIndex={0}
        >
          <div className="category-icon">
            {cat.isImage ? (
              <img 
                src={cat.icon} 
                alt={cat.name}
                className="category-logo"
                style={{
                  width: '35px',
                  height: '35px',
                  objectFit: 'contain',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <span className="icon">{cat.icon}</span>
            )}
            {cat.count > 0 && <span className="badge">{cat.count}</span>}
          </div>
          <span className="category-name">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}