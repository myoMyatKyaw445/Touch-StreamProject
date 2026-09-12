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

  const hasInitialFocused = useRef(false);
  const lastFocusedMatchId = useRef(null);
  const hasLoadedOnce = useRef(false);
  const prevCategoryRef = useRef('vnserver');

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // ၁။ Keyboard Navigation Logic (TV/Box အတွက် အထူး Optimize လုပ်ထားသည်)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (window.innerWidth < 768 || selectedMatch) return;

      const isDesktopOrTV = window.innerWidth >= 1024 || (typeof window !== 'undefined' && window.screen.width > 1000);
      
      const navFocusables = Array.from(document.querySelectorAll(isDesktopOrTV ? '.top-nav .focusable-item' : '.bottom-nav .focusable-item'));
      const filterFocusables = Array.from(document.querySelectorAll('.filters-wrapper .focusable-item'));
      const matchFocusables = Array.from(document.querySelectorAll('.matches-list .focusable-item'));
      
      if (filterFocusables.length === 0 && matchFocusables.length === 0) return;

      const navCount = navFocusables.length;
      const categoryCount = 3;
      const statusCount = 3;
      const filterCount = categoryCount + statusCount;
      const matchCount = matchFocusables.length;

      let allFocusables;
      if (isDesktopOrTV) {
        allFocusables = [...navFocusables, ...filterFocusables, ...matchFocusables];
      } else {
        allFocusables = [...filterFocusables, ...matchFocusables, ...navFocusables];
      }

      const currentElement = document.activeElement;
      const currentIndex = allFocusables.indexOf(currentElement);

      if (currentIndex === -1) {
        if (allFocusables.length > 0) {
          const targetIndex = isDesktopOrTV ? navCount : 0;
          allFocusables[targetIndex].focus();
        }
        return;
      }

      let nextIndex = currentIndex;
      let shouldPreventDefault = true;
      let isNav, isCategoryFilter, isStatusFilter, isMatchCard;

      if (isDesktopOrTV) {
        isNav = currentIndex < navCount;
        isCategoryFilter = currentIndex >= navCount && currentIndex < navCount + categoryCount;
        isStatusFilter = currentIndex >= navCount + categoryCount && currentIndex < navCount + filterCount;
        isMatchCard = currentIndex >= navCount + filterCount;
      } else {
        isCategoryFilter = currentIndex < categoryCount;
        isStatusFilter = currentIndex >= categoryCount && currentIndex < filterCount;
        isMatchCard = currentIndex >= filterCount && currentIndex < filterCount + matchCount;
        isNav = currentIndex >= filterCount + matchCount;
      }

      if (e.key === 'ArrowRight') {
        if (currentIndex < allFocusables.length - 1) nextIndex = currentIndex + 1;
        else shouldPreventDefault = false;
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) nextIndex = currentIndex - 1;
        else shouldPreventDefault = false;
      } else if (e.key === 'ArrowDown') {
        if (isDesktopOrTV && isNav) {
          nextIndex = navCount;
        } else if (!isDesktopOrTV && isNav) {
          shouldPreventDefault = false;
        } else if (isCategoryFilter || isStatusFilter) {
          nextIndex = isDesktopOrTV ? navCount + filterCount : filterCount;
        } else if (isMatchCard) {
          // ✅ TV အတွက် getBoundingClientRect ကို ဖျက်ပြီး ရိုးရှင်းတဲ့ Index တွက်နည်းကို သုံးပါသည် (Performance အတွက်)
          const columns = isDesktopOrTV ? 4 : 2; 
          if (currentIndex + columns < allFocusables.length) {
            nextIndex = currentIndex + columns;
          } else {
            shouldPreventDefault = false;
          }
        }
      } else if (e.key === 'ArrowUp') {
        if (isMatchCard) {
          // ✅ TV အတွက် getBoundingClientRect ကို ဖျက်ပြီး ရိုးရှင်းတဲ့ Index တွက်နည်းကို သုံးပါသည်
          const columns = isDesktopOrTV ? 4 : 2;
          if (currentIndex - columns >= (isDesktopOrTV ? navCount + filterCount : filterCount)) {
            nextIndex = currentIndex - columns;
          } else {
            nextIndex = isDesktopOrTV ? navCount : 0;
          }
        } else if (isDesktopOrTV && isCategoryFilter) {
          nextIndex = 0;
        } else if (isDesktopOrTV && isStatusFilter) {
          nextIndex = 0;
        } else if (!isDesktopOrTV && isStatusFilter) {
          nextIndex = 0;
        } else if (!isDesktopOrTV && isCategoryFilter) {
          shouldPreventDefault = false;
        } else if (isNav) {
          shouldPreventDefault = false;
        }
      } else if (e.key === 'Enter' || e.key === 'Ok' || e.key === ' ') {
        e.preventDefault();
        currentElement.click();
        return;
      } else {
        return;
      }

      if (shouldPreventDefault && nextIndex >= 0 && nextIndex < allFocusables.length) {
        e.preventDefault();
        allFocusables[nextIndex].focus();
        allFocusables[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (!hasInitialFocused.current) {
      setTimeout(() => {
        const filterFocusables = Array.from(document.querySelectorAll('.filters-wrapper .focusable-item'));
        if (filterFocusables.length > 0) {
          filterFocusables[0].focus();
          hasInitialFocused.current = true;
        }
      }, 500);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMatch, selectedCategory, selectedStatus, matches.length]);

  // ၂။ Data Fetching Logic
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async (isInitialCheck, isCategoryChanged = false) => {
      if (isInitialCheck) {
        setInitialCheck(true);
        setConnectionError(false);
      }
      
      if (isCategoryChanged && !isInitialCheck) {
        setLoading(true);
      }

      const fetchPromise = (async () => {
        try {
          let rawData = [];
          
          if (selectedCategory === 'chinaserver') {
            const response = await fetch(`/api/china-data?t=${Date.now()}`); 
            if (!response.ok) throw new Error('Failed to fetch China data from API');
            const jsonData = await response.json();
            if (jsonData.code === 200 && jsonData.data && Array.isArray(jsonData.data.matches)) {
              rawData = jsonData.data.matches;
            } else {
              rawData = [];
            }
          } else if (selectedCategory === 'vnserver') {
            const response = await fetch(`https://raw.githubusercontent.com/devxseven/mdata/refs/heads/main/matches.json?t=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to fetch VN data');
            const data = await response.json();
            rawData = data.context || [];
          } else if (selectedCategory === 'myanmarsound') {
            const response = await fetch(`/api/fmp-data?t=${Date.now()}`); 
            if (!response.ok) throw new Error('Failed to fetch FMP data from API');
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
            if (typeof rawTime === 'number' && rawTime > 0) {
              dateObj = new Date(rawTime);
            } else if (typeof rawTime === 'string' && /^\d{10,}$/.test(rawTime)) {
              dateObj = new Date(parseInt(rawTime, 10) * 1000);
            } else {
              dateObj = new Date(rawTime);
            }

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

      if (isInitialCheck) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second only
      }

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
          
          if (isCategoryChanged && !isInitialCheck) {
            setLoading(false);
          }
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
    
    if (!hasLoadedOnce.current) {
      fetchData(true, false);
    } else {
      fetchData(false, isCategoryChanged);
    }
    
    prevCategoryRef.current = selectedCategory;

    const interval = setInterval(() => {
      if (hasLoadedOnce.current) {
        fetchData(false, false);
      }
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
        console.error("❌ Failed to fetch stream details:", error);
        setSelectedMatch(prev => ({ ...prev, links: [] }));
      }
    }
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

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
          <p className="error-message">
            ကျေးဇူးပြု၍ VPN အသုံးပြုပါ<br />
            သို့မဟုတ် အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ
          </p>
          <button className="retry-button" onClick={handleRetry}>
            🔄 ပြန်လည်စစ်ဆေးပါ
          </button>
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