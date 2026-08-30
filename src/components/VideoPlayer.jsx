import { useEffect } from 'react';
import { openExternalPlayer } from '../utils/openExternalPlayer';
import './VideoPlayer.css';

export default function VideoPlayer({ match, onLinkClick, onClose }) {
  const { homeTeam, awayTeam, league, myanmarTime, links } = match;

  const handleStreamClick = (url) => {
    openExternalPlayer(url);
    onClose();
  };

  // 🎯 Keyboard Navigation Logic for Stream Links
  useEffect(() => {
    const handleKeyDown = (e) => {
      const focusable = Array.from(document.querySelectorAll('.link-card'));
      if (focusable.length === 0) return;

      const current = document.activeElement;
      const currentIndex = focusable.indexOf(current);

      // Grid ရဲ့ Column အရေအတွက်ကို တွက်ချက်ခြင်း
      let columns = 1;
      if (focusable.length > 1) {
        const firstTop = focusable[0].offsetTop;
        for (let i = 1; i < focusable.length; i++) {
          if (focusable[i].offsetTop > firstTop) {
            columns = i;
            break;
          }
        }
      }

      let nextIndex = currentIndex;
      let shouldPreventDefault = true;

      if (e.key === 'ArrowRight') {
        if (currentIndex < focusable.length - 1) nextIndex = currentIndex + 1;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) nextIndex = currentIndex - 1;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'ArrowDown') {
        if (currentIndex + columns < focusable.length) nextIndex = currentIndex + columns;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'ArrowUp') {
        if (currentIndex - columns >= 0) nextIndex = currentIndex - columns;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'Enter' || e.key === 'Ok' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex !== -1) current.click();
        return;
      } 
      else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        onClose(); // Back Key နှိပ်ရင် Homepage ကို ပြန်သွားမယ်
        return;
      } 
      else {
        return;
      }

      if (shouldPreventDefault && currentIndex !== -1) {
        e.preventDefault();
        focusable[nextIndex].focus();
        focusable[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (currentIndex === -1) {
        // ဘာမှ Focus မရသေးရင် ပထမဆုံး Link ကို Focus ပေးမယ်
        focusable[0].focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Overlay ဖွင့်ဖွင့်ချင်း ပထမဆုံး Link Card ကို Auto-focus ပေးမယ်
    setTimeout(() => {
      const firstCard = document.querySelector('.link-card');
      if (firstCard) firstCard.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [links, onClose]);

  return (
    <div className="video-player-overlay">
      <div className="links-selection">
        <div className="player-header">
          <div className="match-info">
            <h2>{homeTeam.name} VS {awayTeam.name}</h2>
            <p className="match-time">🕒 {myanmarTime}</p>
            <p className="league-name">🏆 {league}</p>
          </div>
          <button onClick={onClose} className="close-btn">✕ ပိတ်မယ်</button>
        </div>
        
        <div className="links-section">
          <h3>Stream Links ({links ? links.length : 0})</h3>
          <p className="section-desc">ကြည့်ရှုရန် Link တစ်ခုကို ရွေးချယ်ပါ (Network Stream Player ဖြင့် ဖွင့်ပါမည်)</p>
          
          {!links || links.length === 0 ? (
            <div className="no-links">
              <p>🚫 ယခုအချိန်တွင် Stream Link မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="links-grid">
              {links.map((link, index) => (
                <button
                  key={index}
                  className="link-card focusable-item"
                  onClick={() => handleStreamClick(link.url)}
                  tabIndex={0}
                >
                  <div className="link-icon">📺</div>
                  <div className="link-info">
                    <h4>{link.name}</h4>
                    <p>Click to open in External Player</p>
                  </div>
                  <div className="link-arrow">→</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}