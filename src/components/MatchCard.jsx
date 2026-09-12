export default function MatchCard({ match, category, onClick }) {
  const { homeTeam, awayTeam, league, myanmarTime, matchStatus, homeScore, awayScore } = match;

  return (
    <div 
      className="match-card focusable-item" 
      onClick={() => onClick(match)}
      tabIndex={0}
      data-match-id={match.id}
      role="button"
    >
      <div className="timer-badge">{myanmarTime}</div>
      <div className="teams-section">
        <div className="team home-team">
          <div className="team-logo-wrapper">
            <img src={homeTeam.logo} alt={homeTeam.name} className="team-logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
            <div className="team-logo-fallback" style={{display: 'none'}}>⚽</div>
          </div>
          <div className="team-info">
            <span className="team-name">{homeTeam.name}</span>
            {matchStatus && category === 'myanmarsound' && <span className="team-score">{homeScore ?? 0}</span>}
          </div>
        </div>
        
        <div className="vs-section">
          <span className="vs-text">VS</span>
        </div>
        
        <div className="team away-team">
          <div className="team-logo-wrapper">
            <img src={awayTeam.logo} alt={awayTeam.name} className="team-logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
            <div className="team-logo-fallback" style={{display: 'none'}}>⚽</div>
          </div>
          <div className="team-info" style={{flexDirection: 'row-reverse'}}>
            <span className="team-name">{awayTeam.name}</span>
            {matchStatus && category === 'myanmarsound' && <span className="team-score">{awayScore ?? 0}</span>}
          </div>
        </div>
      </div>
      
      <div className="league-section">
        <div className="league-info">
          <span className="league-name">{league}</span>
        </div>
        {matchStatus && <span className="live-badge"> Live</span>}
      </div>
    </div>
  );
}