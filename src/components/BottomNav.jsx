export default function BottomNav({ active, onSelect }) {
  const navItems = [
    { id: 'live', icon: '📡', label: 'Live Events' },
    { id: 'categories', icon: '📂', label: 'Categories' },
    { id: 'sports', icon: '⚽', label: 'Sports' },
  ];

  return (
    <>
      {/* Top Nav - Desktop, Laptop, TV (1024px အထက်) အတွက် */}
      <nav className="top-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item focusable-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
            tabIndex={0}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Nav - Mobile, Tablet (1023px အောက်) အတွက် */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item focusable-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
            tabIndex={0}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}