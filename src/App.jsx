import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import StatusFilter from './components/StatusFilter';
import MatchCard from './components/MatchCard';
import BottomNav from './components/BottomNav';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

function App() {
  const [matches, setMatches] = useState([]);
  const [initialCheck, setInitialCheck] = useState(true);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [activeNav, setActiveNav] = useState('live');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [activeLink, setActiveLink] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('vnserver');
  
  const [categoryCounts, setCategoryCounts] = useState({ vnserver: 0, myanmarsound: 0, chinaserver: 0 });
  const [statuses, setStatuses] = useState([
    { id: 'all', name: 'All', count: 0 },
    { id: 'live', name: 'Live', count: 0 },
    { id: 'upcoming', name: 'Upcoming', count: 0 },
  ]);

  const lastFocusedMatchId = useRef(null);
  const hasLoadedOnce = useRef(false);
  const prevCategoryRef = useRef('vnserver');

  // ✅ Perfect Section-based Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedMatch) return;

      const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '];
      if (!validKeys.includes(e.key)) return;

      const topNavItems = Array.from(document.querySelectorAll('.top-nav .focusable-item'));
      const categoryItems = Array.from(document.querySelectorAll('.category-filter .focusable-item'));
      const statusItems = Array.from(document.querySelectorAll('.status-filter .focusable-item'));
      const matchCards = Array.from(document.querySelectorAll('.matches-list .focusable-item'));

      const currentElement = document.activeElement;
      
      let currentSection = null;
      let currentIndexInSection = -1;

      if (topNavItems.includes(currentElement)) {
        currentSection = 'topNav';
        currentIndexInSection = topNavItems.indexOf(currentElement);
      } else if (categoryItems.includes(currentElement)) {
        currentSection = 'category';
        currentIndexInSection = categoryItems.indexOf(currentElement);
      } else if (statusItems.includes(currentElement)) {
        currentSection = 'status';
        currentIndexInSection = statusItems.indexOf(currentElement);
      } else if (matchCards.includes(currentElement)) {
        currentSection = 'matches';
        currentIndexInSection = matchCards.indexOf(currentElement);
      }

      if (!currentSection) {
        topNavItems[0]?.focus();
        return;
      }

      let targetElement = null;

      if (e.key === 'ArrowRight') {
        if (currentSection === 'topNav' && currentIndexInSection < topNavItems.length - 1) {
          targetElement = topNavItems[currentIndexInSection + 1];
        } else if (currentSection === 'category' && currentIndexInSection < categoryItems.length - 1) {
          targetElement = categoryItems[currentIndexInSection + 1];
        } else if (currentSection === 'status' && currentIndexInSection < statusItems.length - 1) {
          targetElement = statusItems[currentIndexInSection + 1];
        } else if (currentSection === 'matches' && currentIndexInSection < matchCards.length - 1) {
          targetElement = matchCards[currentIndexInSection + 1];
        }
      } 
      else if (e.key === 'ArrowLeft') {
        if (currentSection === 'topNav' && currentIndexInSection > 0) {
          targetElement = topNavItems[currentIndexInSection - 1];
        } else if (currentSection === 'category' && currentIndexInSection > 0) {
          targetElement = categoryItems[currentIndexInSection - 1];
        } else if (currentSection === 'status' && currentIndexInSection > 0) {
          targetElement = statusItems[currentIndexInSection - 1];
        } else if (currentSection === 'matches' && currentIndexInSection > 0) {
          targetElement = matchCards[currentIndexInSection - 1];
        }
      } 
      else if (e.key === 'ArrowDown') {
        if (currentSection === 'topNav') {
          targetElement = categoryItems[0];
        } else if (currentSection === 'category') {
          targetElement = statusItems[0];
        } else if (currentSection === 'status') {
          targetElement = matchCards[0];
        } else if (currentSection === 'matches') {
          const columns = 4;
          const nextIndex = currentIndexInSection + columns;
          if (nextIndex < matchCards.length) {
            targetElement = matchCards[nextIndex];
          }
        }
      } 
      else if (e.key === 'ArrowUp') {
        if (currentSection === 'matches') {
          const columns = 4;
          const currentColumn = currentIndexInSection % columns;
          const targetStatusIndex = Math.min(currentColumn, statusItems.length - 1);
          targetElement = statusItems[targetStatusIndex];
        } else if (currentSection === 'status') {
          const targetCategoryIndex = Math.min(currentIndexInSection, categoryItems.length - 1);
          targetElement = categoryItems[targetCategoryIndex];
        } else if (currentSection === 'category') {
          const targetNavIndex = Math.min(currentIndexInSection, topNavItems.length - 1);
          targetElement = topNavItems[targetNavIndex];
        }
      } 
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        currentElement.click();
        return;
      }

      if (targetElement) {
        e.preventDefault();
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      const firstNavItem = document.querySelector('.top-nav .focusable-item');
      if (firstNavItem) {
        firstNavItem.focus();
      }
    }, 800);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [selectedMatch, matches.length]);

  // ၂။ Scroll Restoration Logic
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // ၃။ Data Fetching Logic (with Timeout)
  useEffect(() => {
    let isCancelled = false;

    // ✅ Fetch Timeout Helper Function (8 စက္ကန့်)
    const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw new Error("Network request timed out");
      }
    };

    const fetchData = async (isInitialCheck, isCategoryChanged = false) => {
      if (isInitialCheck) {
        setInitialCheck(true);
        setConnectionError(false);
      }
      if (isCategoryChanged && !isInitialCheck) setLoading(true);

      const fetchPromise = (async () => {
        try {
          let rawData = [];
          
          if (selectedCategory === 'chinaserver') {
            const response = await fetchWithTimeout(`/api/china-data?t=${Date.now()}`); 
            if (!response.ok) throw new Error('Failed to fetch China data');
            const jsonData = await response.json();
            if (jsonData.code === 200 && jsonData.data && Array.isArray(jsonData.data.matches)) {
              rawData = jsonData.data.matches;
            }
          } else if (selectedCategory === 'vnserver') {
            const response = await fetchWithTimeout(`https://cdn.jsdelivr.net/gh/devxseven/mdata@main/matches.json?t=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to fetch VN data');
            const data = await response.json();
            rawData = data.context || [];
          } else if (selectedCategory === 'myanmarsound') {
            const response = await fetchWithTimeout(`/api/fmp-data?t=${Date.now()}`); 
            if (!response.ok) throw new Error('Failed to fetch FMP data');
            rawData = await response.json(); 
          }

          const processedMatches = rawData.map(match => {
            const isChina = selectedCategory === 'chinaserver';
            const homeName = isChina ? match.hostName : (match.home_name || match.homeTeam?.name);
            const homeLogo = isChina ? match.hostIcon : (match.home_img || match.homeTeam?.logo);
            const awayName = isChina ? match.guestName : (match.away_name || match.awayTeam?.name);
            const awayLogo = isChina ? match.guestIcon : (match.away_img || match.awayTeam?.logo);
            const rawTime = isChina ? match.matchTime : match.match_time;
            const matchStatus = isChina ? (match.matchStatus === 1 || match.matchStatus === 2) : (match.match_status === true);
            const homeScore = isChina ? (match.hostScore ?? 0) : (match.homeScore ?? match.homeTeam?.score ?? 0);
            const awayScore = isChina ? (match.guestScore ?? 0) : (match.awayScore ?? match.awayTeam?.score ?? 0);
            const matchId = isChina ? match.scheduleId : match.id;
            const leagueName = isChina ? match.subCateName : match.league;

            let links = [];
            let tempRoomNum = null; 
            if (isChina) {
              if (match.anchors && match.anchors.length > 0) {
                tempRoomNum = match.anchors[0].anchor?.roomNum || match.anchors[0].uid;
              }
            } else {
              links = match.links || [];
            }

            let dateObj;
            if (typeof rawTime === 'number' && rawTime > 0) dateObj = new Date(rawTime);
            else if (typeof rawTime === 'string' && /^\d{10,}$/.test(rawTime)) dateObj = new Date(parseInt(rawTime, 10) * 1000);
            else dateObj = new Date(rawTime);

            const myanmarTime = dateObj.toLocaleString('en-US', {
              timeZone: 'Asia/Yangon', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
            });

            return {
              id: matchId,
              homeTeam: { name: homeName, logo: homeLogo },
              awayTeam: { name: awayName, logo: awayLogo },
              league: leagueName,
              matchStatus: matchStatus, 
              myanmarTime: myanmarTime,
              links: links,
              _roomNum: tempRoomNum, 
              homeScore: homeScore,
              awayScore: awayScore,
              timing: isChina ? match.timing : ''
            };
          });

          return { success: true, data: processedMatches };
        } catch (error) {
          console.error("❌ Fetch Error:", error);
          return { success: false, error };
        }
      })();

      if (isInitialCheck) await new Promise(resolve => setTimeout(resolve, 1000));

      if (!isCancelled) {
        const result = await fetchPromise;
        if (result.success) {
          setMatches(result.data);
          const liveCount = result.data.filter(m => m.matchStatus).length;
          const upcomingCount = result.data.filter(m => !m.matchStatus).length;
          
          setCategoryCounts(prev => ({ ...prev, [selectedCategory]: result.data.length }));
          setStatuses([
            { id: 'all', name: 'All', count: result.data.length },
            { id: 'live', name: 'Live', count: liveCount },
            { id: 'upcoming', name: 'Upcoming', count: upcomingCount },
          ]);
          
          if (isInitialCheck) {
            setInitialCheck(false);
            hasLoadedOnce.current = true;
          }
          if (isCategoryChanged && !isInitialCheck) setLoading(false);
        } else {
          if (isInitialCheck) {
            setInitialCheck(false);
            setConnectionError(true);
          }
          if (isCategoryChanged && !isInitialCheck) {
            setMatches([]); 
            setConnectionError(true);
            setLoading(false);
          }
        }
      }
    };

    const isCategoryChanged = prevCategoryRef.current !== selectedCategory;
    if (!hasLoadedOnce.current) fetchData(true, false);
    else fetchData(false, isCategoryChanged);
    
    prevCategoryRef.current = selectedCategory;

    const interval = setInterval(() => {
      if (hasLoadedOnce.current) fetchData(false, false);
    }, 15000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [selectedCategory, retryTrigger, connectionError]);

  const handleRetry = () => {
    hasLoadedOnce.current = false;
    setRetryTrigger(prev => prev + 1);
  };

  const handleMatchClick = async (match) => {
    setSelectedMatch(match);
    lastFocusedMatchId.current = match.id;
    window.history.pushState({ step: 1 }, '');
    
    if (selectedCategory === 'chinaserver' && match._roomNum) {
      try {
        const response = await fetch(`/api/china-stream?roomNum=${match._roomNum}`);
        const result = await response.json();
        if (result.success && result.stream) {
          const newLinks = [];
          if (result.stream.hdM3u8) newLinks.push({ name: "HD Stream (m3u8)", url: result.stream.hdM3u8 });
          if (result.stream.m3u8) newLinks.push({ name: "Standard (m3u8)", url: result.stream.m3u8 });
          if (result.stream.hdFlv) newLinks.push({ name: "HD Stream (FLV)", url: result.stream.hdFlv });
          if (result.stream.flv) newLinks.push({ name: "Standard (FLV)", url: result.stream.flv });
          setSelectedMatch(prev => ({ ...prev, links: newLinks }));
        } else {
          setSelectedMatch(prev => ({ ...prev, links: [] }));
        }
      } catch (error) {
        console.error(" Failed to fetch stream details:", error);
        setSelectedMatch(prev => ({ ...prev, links: [] }));
      }
    }
  };

  const handleLinkClick = (link) => setActiveLink(link);

  const handleClosePlayer = () => {
    setSelectedMatch(null);
    setActiveLink(null);
    window.history.back(); 
    setTimeout(() => {
      if (lastFocusedMatchId.current) {
        const matchCard = document.querySelector(`[data-match-id="${lastFocusedMatchId.current}"]`);
        if (matchCard) {
          matchCard.focus();
          matchCard.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }, 100);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      const isRoot = !state || state.step === undefined || state.step === null;
      if (isRoot) {
        setSelectedMatch(null);
        setActiveLink(null);
        setTimeout(() => {
          if (lastFocusedMatchId.current) {
            const matchCard = document.querySelector(`[data-match-id="${lastFocusedMatchId.current}"]`);
            if (matchCard) {
              matchCard.focus();
              matchCard.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
          }
        }, 100);
      } 
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); 

  const filteredMatches = matches.filter(match => {
    if (selectedStatus === 'live') return match.matchStatus === true;
    if (selectedStatus === 'upcoming') return match.matchStatus === false;
    return true;
  }).sort((a, b) => {
    if (a.matchStatus && !b.matchStatus) return -1;
    if (!a.matchStatus && b.matchStatus) return 1;
    if (a.matchStatus && b.matchStatus) {
      const aTiming = parseInt(a.timing || '999', 10);
      const bTiming = parseInt(b.timing || '999', 10);
      return aTiming - bTiming;
    }
    return new Date(a.myanmarTime) - new Date(b.myanmarTime);
  });

  if (initialCheck) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">ဝင်ရောက်မှုစစ်ဆေးနေသည်... (ကျေးဇူးပြု၍ စောင့်ပါ)</p>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="connection-error-container">
        <div className="error-content">
          <div className="error-icon">🌐</div>
          <h2 className="error-title">ချိတ်ဆက်မှု မှားယွင်းနေသည်</h2>
          <p className="error-message">ကျေးဇူးပြု၍ VPN အသုံးပြုပါ<br />သို့မဟုတ် အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ</p>
          <button className="retry-button" onClick={handleRetry}>🔄 ပြန်လည်စစ်ဆေးပါ</button>
        </div>
      </div>
    );
  }

  const isTV = typeof window !== 'undefined' && window.screen.width > 1000;

  return (
    <div className={`app ${isTV ? 'tv-layout' : ''}`}>
      <Header />
      <BottomNav active={activeNav} onSelect={setActiveNav} />
      <div className="filters-wrapper">
        <CategoryFilter 
          categories={[
            { id: 'vnserver', name: 'VN Server', icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw8MDnWAjN3smohKgCiVaFj-NXNVRk1BgTY_6g6SVQIQ&s=10', count: categoryCounts.vnserver, isImage: true },
            { id: 'myanmarsound', name: 'မြန်မာအသံ server', icon: 'https://i.pinimg.com/1200x/dc/2c/96/dc2c964e781001ba6213e0cbf5388185.jpg', count: categoryCounts.myanmarsound, isImage: true },
            { id: 'chinaserver', name: 'China Server', icon: 'https://sta.ncctrials.com/web/assets/yy/img/match-cover.png', count: categoryCounts.chinaserver, isImage: true }
          ]} 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        <StatusFilter 
          statuses={statuses} 
          selected={selectedStatus} 
          onSelect={setSelectedStatus} 
        />
      </div>
      
      <main className="main-content">
        {loading ? (
          <div className="loading"><div className="spinner"></div><p>Loading matches...</p></div>
        ) : filteredMatches.length === 0 ? (
          <div className="no-matches"><p>No matches found for this filter.</p></div>
        ) : (
          <div className="matches-list">
            {filteredMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                category={selectedCategory} 
                onClick={handleMatchClick} 
              />
            ))}
          </div>
        )}
      </main>

      {selectedMatch && (
        <VideoPlayer 
          match={selectedMatch} 
          activeLink={activeLink}
          onLinkClick={handleLinkClick}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}

export default App;