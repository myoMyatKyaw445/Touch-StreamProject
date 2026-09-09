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
  const [loading, setLoading] = useState(false); // ✅ Category ပြောင်းရင် ပြမယ့် Loading
  const [connectionError, setConnectionError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [activeLink, setActiveLink] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('vnserver');
  
  const [categoryCounts, setCategoryCounts] = useState({ vnserver: 0, myanmarsound: 0 });
  const [statuses, setStatuses] = useState([
    { id: 'all', name: 'All', count: 0 },
    { id: 'live', name: 'Live', count: 0 },
    { id: 'upcoming', name: 'Upcoming', count: 0 },
  ]);

  const hasInitialFocused = useRef(false);
  const lastFocusedMatchId = useRef(null);
  const hasLoadedOnce = useRef(false);
  const prevCategoryRef = useRef('vnserver'); // ✅ ယခင် Category ကို မှတ်ထားရန်

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 🎯 ၁။ Keyboard Navigation Logic (မူလအတိုင်း)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (window.innerWidth < 768 || selectedMatch) return;

      const filterFocusables = Array.from(document.querySelectorAll('.filters-wrapper .focusable-item'));
      const matchFocusables = Array.from(document.querySelectorAll('.matches-list .focusable-item'));
      const navFocusables = Array.from(document.querySelectorAll('.bottom-nav .focusable-item'));
      
      if (filterFocusables.length === 0 && matchFocusables.length === 0) return;

      const allFocusables = [...filterFocusables, ...matchFocusables, ...navFocusables];
      const currentElement = document.activeElement;
      const currentIndex = allFocusables.indexOf(currentElement);

      if (currentIndex === -1) {
        if (allFocusables.length > 0) allFocusables[0].focus();
        return;
      }

      let nextIndex = currentIndex;
      let shouldPreventDefault = true;
      
      const categoryCount = 2;
      const statusCount = 3;
      const filterCount = categoryCount + statusCount;
      const matchCount = matchFocusables.length;
      
      const isCategoryFilter = currentIndex < categoryCount;
      const isStatusFilter = currentIndex >= categoryCount && currentIndex < filterCount;
      const isMatchCard = currentIndex >= filterCount && currentIndex < filterCount + matchCount;
      const isNav = currentIndex >= filterCount + matchCount;

      if (e.key === 'ArrowRight') {
        if (currentIndex < allFocusables.length - 1) nextIndex = currentIndex + 1;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) nextIndex = currentIndex - 1;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'ArrowDown') {
        if (isCategoryFilter || isStatusFilter) {
          if (matchCount > 0) nextIndex = filterCount;
          else shouldPreventDefault = false;
        } 
        else if (isMatchCard) {
          const currentCardIndex = currentIndex - filterCount;
          const currentCard = matchFocusables[currentCardIndex];
          const currentRect = currentCard.getBoundingClientRect();
          
          let bestMatch = -1;
          let minDistance = Infinity;
          let nextRowTop = Infinity;

          for (let i = 0; i < matchFocusables.length; i++) {
            if (i === currentCardIndex) continue;
            const targetRect = matchFocusables[i].getBoundingClientRect();
            if (targetRect.top > currentRect.bottom - 10) { 
              if (targetRect.top < nextRowTop) nextRowTop = targetRect.top;
            }
          }

          if (nextRowTop !== Infinity) {
            const currentCenter = currentRect.left + currentRect.width / 2;
            for (let i = 0; i < matchFocusables.length; i++) {
              if (i === currentCardIndex) continue;
              const targetRect = matchFocusables[i].getBoundingClientRect();
              if (Math.abs(targetRect.top - nextRowTop) < 15) {
                const targetCenter = targetRect.left + targetRect.width / 2;
                const distance = Math.abs(currentCenter - targetCenter);
                if (distance < minDistance) {
                  minDistance = distance;
                  bestMatch = i;
                }
              }
            }
          }

          if (bestMatch !== -1) nextIndex = filterCount + bestMatch;
          else if (navFocusables.length > 0) nextIndex = filterCount + matchCount;
          else shouldPreventDefault = false;
        }
        else if (isNav) shouldPreventDefault = false;
      }
      else if (e.key === 'ArrowUp') {
        if (isNav) {
          if (matchCount > 0) nextIndex = filterCount + matchCount - 1;
          else if (filterCount > 0) nextIndex = filterCount - 1;
          else shouldPreventDefault = false;
        } 
        else if (isMatchCard) {
          const currentCardIndex = currentIndex - filterCount;
          const currentCard = matchFocusables[currentCardIndex];
          const currentRect = currentCard.getBoundingClientRect();
          
          let bestMatch = -1;
          let minDistance = Infinity;
          let prevRowTop = -Infinity;

          for (let i = 0; i < matchFocusables.length; i++) {
            if (i === currentCardIndex) continue;
            const targetRect = matchFocusables[i].getBoundingClientRect();
            if (targetRect.bottom < currentRect.top + 10) { 
              if (targetRect.top > prevRowTop) prevRowTop = targetRect.top;
            }
          }

          if (prevRowTop !== -Infinity) {
            const currentCenter = currentRect.left + currentRect.width / 2;
            for (let i = 0; i < matchFocusables.length; i++) {
              if (i === currentCardIndex) continue;
              const targetRect = matchFocusables[i].getBoundingClientRect();
              if (Math.abs(targetRect.top - prevRowTop) < 15) {
                const targetCenter = targetRect.left + targetRect.width / 2;
                const distance = Math.abs(currentCenter - targetCenter);
                if (distance < minDistance) {
                  minDistance = distance;
                  bestMatch = i;
                }
              }
            }
          }

          if (bestMatch !== -1) nextIndex = filterCount + bestMatch;
          else if (statusCount > 0) {
            const colIndex = currentCardIndex % 4; 
            nextIndex = categoryCount + Math.min(colIndex, statusCount - 1);
          } else shouldPreventDefault = false;
        }
        else if (isStatusFilter) {
          const statusIndex = currentIndex - categoryCount;
          if (statusIndex === 0 || statusIndex === 1) nextIndex = 0;
          else nextIndex = 1;
        } 
        else if (isCategoryFilter) shouldPreventDefault = false;
      } 
      else if (e.key === 'Enter' || e.key === 'Ok' || e.key === ' ') {
        e.preventDefault();
        currentElement.click();
        return;
      } 
      else return;

      if (shouldPreventDefault && nextIndex >= 0 && nextIndex < allFocusables.length) {
        e.preventDefault();
        allFocusables[nextIndex].focus();
        allFocusables[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (!hasInitialFocused.current) {
      setTimeout(() => {
        const firstFocusable = document.querySelector('.focusable-item');
        if (firstFocusable) {
          firstFocusable.focus();
          hasInitialFocused.current = true;
        }
      }, 500);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMatch, selectedCategory, selectedStatus, matches.length]);

  // 🎯 ၂။ Data Fetching Logic (Category ပြောင်းမှသာ Loading ပြမယ်)
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async (isInitialCheck, isCategoryChanged = false) => {
      // Initial Check (App ဝင်ဝင်ချင်း သို့မဟုတ် Retry)
      if (isInitialCheck) {
        setInitialCheck(true);
        setConnectionError(false);
      }
      
      // ✅ Category ပြောင်းရင်သာ Loading ပြမယ်
      if (isCategoryChanged && !isInitialCheck) {
        setLoading(true);
      }

      const fetchPromise = (async () => {
        try {
          let rawData = [];
          if (selectedCategory === 'vnserver') {
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
            const rawTime = match.match_time;
            let dateObj = typeof rawTime === 'string' && /^\d{10,}$/.test(rawTime) 
              ? new Date(parseInt(rawTime, 10) * 1000) 
              : new Date(rawTime);

            const myanmarTime = dateObj.toLocaleString('en-US', {
              timeZone: 'Asia/Yangon', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
            });

            return {
              id: match.id,
              homeTeam: { name: match.home_name || match.homeTeam?.name, logo: match.home_img || match.homeTeam?.logo },
              awayTeam: { name: match.away_name || match.awayTeam?.name, logo: match.away_img || match.awayTeam?.logo },
              league: match.league,
              matchStatus: match.match_status === true, 
              myanmarTime: myanmarTime,
              links: match.links || [],
              homeScore: match.homeScore ?? match.homeTeam?.score ?? 0,
              awayScore: match.awayScore ?? match.awayTeam?.score ?? 0
            };
          });

          return { success: true, data: processedMatches };
        } catch (error) {
          console.error("❌ Fetch Error:", error);
          return { success: false, error };
        }
      })();

      // 5 စက္ကန့် စောင့်ဆိုင်းမှု (Initial Check ဖြစ်မှသာ)
      if (isInitialCheck) {
        await new Promise(resolve => setTimeout(resolve, 5000));
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
          
          // ✅ Category ပြောင်းတာဆိုရင် Loading ကို ပိတ်မယ်
          if (isCategoryChanged && !isInitialCheck) {
            setLoading(false);
          }
        } else {
          if (isInitialCheck) {
            setInitialCheck(false);
            setConnectionError(true);
          }
          if (isCategoryChanged && !isInitialCheck) {
            setLoading(false);
          }
        }
      }
    };

    // ✅ Category ပြောင်း/မပြောင်း စစ်ဆေးမယ်
    const isCategoryChanged = prevCategoryRef.current !== selectedCategory;
    
    // ပထမဆုံး Load (သို့) Retry ဖြစ်ရင် isInitialCheck = true
    if (!hasLoadedOnce.current) {
      fetchData(true, false);
    } else {
      // ✅ Category ပြောင်းရင် isCategoryChanged = true, မပြောင်းရင် false
      fetchData(false, isCategoryChanged);
    }
    
    // ✅ Category ပြောင်းပြီးရင် prevCategory ကို update လုပ်မယ်
    prevCategoryRef.current = selectedCategory;

    // 15 စက္ကန့်တစ်ခါ Background Update (Category မပြောင်းတဲ့အတွက် Loading မပြဘူး)
    const interval = setInterval(() => {
      if (hasLoadedOnce.current && !connectionError) {
        fetchData(false, false); // isCategoryChanged = false
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

  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    lastFocusedMatchId.current = match.id;
    window.history.pushState({ step: 1 }, '');
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
  });

  // ✅ ၁။ Initial Loading Screen (App ဝင်ဝင်ချင်း 5 စက္ကန့် ပြမယ်)
  if (initialCheck) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">ဝင်ရောက်မှုစစ်ဆေးနေသည်... (ကျေးဇူးပြု၍ စောင့်ပါ)</p>
      </div>
    );
  }

  // ✅ ၂။ Connection Error Screen (VPN မရှိရင် ပြမယ်)
  if (connectionError) {
    return (
      <div className="connection-error-container">
        <div className="error-content">
          <div className="error-icon"></div>
          <h2 className="error-title">ချိတ်ဆက်မှု မှားယွင်းနေသည်</h2>
          <p className="error-message">
            ကျေးူးပြု၍ VPN အသုံးပြုပါ<br />
            သို့မဟုတ် အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ
          </p>
          <button className="retry-button" onClick={handleRetry}>
            🔄 ပြန်လည်စစ်ဆေးပါ
          </button>
        </div>
      </div>
    );
  }

  // ✅ ၃။ Main Homepage
  return (
    <div className="app">
      <Header />
      
      <div className="filters-wrapper">
        <CategoryFilter 
          categories={[
            { id: 'vnserver', name: 'VN Server', icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw8MDnWAjN3smohKgCiVaFj-NXNVRk1BgTY_6g6SVQIQ&s=10', count: categoryCounts.vnserver, isImage: true },
            { id: 'myanmarsound', name: 'မြန်မာအသံ server', icon: 'https://i.pinimg.com/1200x/dc/2c/96/dc2c964e781001ba6213e0cbf5388185.jpg', count: categoryCounts.myanmarsound, isImage: true }
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
        {/* ✅ Category ပြောင်းရင်သာ Loading ပြမယ် */}
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
      
      <BottomNav active="live" onSelect={() => {}} />

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