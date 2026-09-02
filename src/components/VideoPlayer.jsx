import { useEffect } from 'react';
import { openExternalPlayer } from '../utils/openExternalPlayer';
import './VideoPlayer.css';

export default function VideoPlayer({ match, onLinkClick, onClose }) {
  const { homeTeam, awayTeam, league, myanmarTime, links } = match;

    const handleStreamClick = (link) => {
    openExternalPlayer(link.url);
    // Modal ကို ချက်ချင်းမပိတ်ဘဲ Parent ကို အသိပေးမယ်
    if (onLinkClick) {
      onLinkClick(link);
    }
  };

  // Link name ကို တိုအောင် ဖြတ်ပေးမည့် function
  const shortenLinkName = (name) => {
    if (!name) return 'Stream';
    // "VS" ပါရင် နောက်ပိုင်းကို ဖျက်မယ်
    if (name.includes('VS') || name.includes('vs')) {
      const parts = name.split(/VS|vs/);
      return parts[0].trim();
    }
    // ၃၀ လုံးကျော်ရင် ြတ်မယ်
    if (name.length > 30) {
      return name.substring(0, 30) + '...';
    }
    return name;
  };

  // 🎯 Keyboard Navigation Logic for Stream Links
  useEffect(() => {
    const handleKeyDown = (e) => {
      const focusable = Array.from(document.querySelectorAll('.link-card'));
      if (focusable.length === 0) return;

      const current = document.activeElement;
      const currentIndex = focusable.indexOf(current);

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
        onClose();
        return;
      } 
      else {
        return;
      }

      if (shouldPreventDefault && currentIndex !== -1) {
        e.preventDefault();
        focusable[nextIndex].focus();
      } else if (currentIndex === -1) {
        focusable[0].focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    setTimeout(() => {
      const firstCard = document.querySelector('.link-card');
      if (firstCard) firstCard.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [links, onClose]);

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div className="links-selection" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className="player-header">
          <div className="match-info">
            <h2>{homeTeam.name} VS {awayTeam.name}</h2>
            <div className="match-meta">
              <span className="match-time">🕒 {myanmarTime}</span>
              <span className="league-name">🏆 {league}</span>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        {/* Links Section */}
        <div className="links-section">
          <h3>Channels ({links ? links.length : 0})</h3>
          
          {!links || links.length === 0 ? (
            <div className="no-links">
              <p>No Stream Available</p>
            </div>
          ) : (
            <div className="links-grid">
              {links.map((link, index) => (
                <button
                  key={index}
                  className="link-card focusable-item"
                    onClick={() => handleStreamClick(link)}
                  tabIndex={0}
                >
                  <div className="link-icon">📺</div>
                  <div className="link-info">
                    <h4>{shortenLinkName(link.name)}</h4>
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