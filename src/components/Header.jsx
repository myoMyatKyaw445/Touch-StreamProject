export default function Header() {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn">☰</button>
        <h1 className="app-title">FMP Live</h1>
      </div>
      <div className="header-right">
        <button className="icon-btn">⭐</button>
        <button className="icon-btn">🔄</button>
        <button className="icon-btn"></button>
      </div>
    </header>
  );
}