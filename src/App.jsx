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
  const [loading, setLoading] = useState(true);
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
    // 🎯 Refresh လုပ်တိုင်း Scroll ကို အပေါ်ဆုံး (အစ) ကနေ ပြန်စအောင် လုပ်ဆောင်ခြင်း
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0; // Scroll ကို အပေါ်ဆုံး ပြန်တင်မယ်
    }
    
    // Browser ရဲ့ Default Scroll Restoration ကို ပိတ်ထားမယ် (Refresh လုပ်ရင် အပေါ်ဆုံးပဲ ရောက်အောင်)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []); // Component စတင်တဲ့အခါ တစ်ကြိမ်သာ Run မယ်
  // 🎯 ၁။ Keyboard Navigation Logic (Homepage အတွက် - အပြီးသတ် ပြင်ဆင်ထားသည်)
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
      
      // Grid Column တွက်ချက်ခြင်း
      let gridColumns = 1;
      if (window.innerWidth >= 1024) gridColumns = 4;
      else if (window.innerWidth >= 768) gridColumns = Math.floor(window.innerWidth / 260);
      else gridColumns = 1;

      // ✅ Zone ခွဲခြားခြင်း (အတိအကျ ပြင်ဆင်ထားသည်)
      const categoryCount = 2; // VN Server, Myanmar Sound
      const statusCount = 3;   // All, Live, Upcoming
      const filterCount = categoryCount + statusCount; // စုစုပေါင်း Filter = 5
      const matchCount = matchFocusables.length;
      
      const isCategoryFilter = currentIndex < categoryCount;
      const isStatusFilter = currentIndex >= categoryCount && currentIndex < filterCount;
      const isMatchCard = currentIndex >= filterCount && currentIndex < filterCount + matchCount;
      const isNav = currentIndex >= filterCount + matchCount;

      if (e.key === 'ArrowRight') {
        if (currentIndex < allFocusables.length - 1) {
          nextIndex = currentIndex + 1;
        } else {
          shouldPreventDefault = false;
        }
      } 
      else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          nextIndex = currentIndex - 1;
        } else {
          shouldPreventDefault = false;
        }
      } 
      else if (e.key === 'ArrowDown') {
        if (isCategoryFilter || isStatusFilter) {
          // Filter (Category သို့မဟုတ် Status) ကနေ အောက်နှိပ်ရင် ပထမဆုံး Match Card ကို သွားမယ်
          if (matchCount > 0) {
            nextIndex = filterCount;
          } else {
            shouldPreventDefault = false;
          }
        } 
        else if (isMatchCard) {
          // Match Card ကနေ အောက်ဆက်မယ်
          const currentCardIndex = currentIndex - filterCount;
          const isLastRow = currentCardIndex >= matchCount - gridColumns;
          
          if (isLastRow) {
            if (navFocusables.length > 0) {
              nextIndex = filterCount + matchCount;
            } else {
              shouldPreventDefault = false;
            }
          } else {
            const potentialNext = currentCardIndex + gridColumns;
            if (potentialNext < matchCount) {
              nextIndex = filterCount + potentialNext;
            } else {
              shouldPreventDefault = false;
            }
          }
        }
        else if (isNav) {
          shouldPreventDefault = false;
        }
      }
      else if (e.key === 'ArrowUp') {
        if (isNav) {
          // Bottom Nav ကနေ အပေါ်တက်ရင် နောက်ဆုံး Match Card ကို သွားမယ်
          if (matchCount > 0) {
            nextIndex = filterCount + matchCount - 1;
          } else if (filterCount > 0) {
            nextIndex = filterCount - 1;
          } else {
            shouldPreventDefault = false;
          }
        } 
        else if (isMatchCard) {
          // Match Card ကနေ အပေါ်တက်မယ်
          const currentCardIndex = currentIndex - filterCount;
          
          if (currentCardIndex < gridColumns) {
            // ပထမ Row မှာ ရှိနေရင် Status Filter ကို သွားမယ်
            if (statusCount > 0) {
              const colIndex = currentCardIndex % gridColumns;
              // Status Filter (Index 2, 3, 4) ထဲက နီးစပ်ရာကို သွားမယ်
              nextIndex = categoryCount + Math.min(colIndex, statusCount - 1);
            } else {
              shouldPreventDefault = false;
            }
          } else {
            // အပေါ်က Row ကို သွားမယ်
            const potentialPrev = currentCardIndex - gridColumns;
            if (potentialPrev >= 0) {
              nextIndex = filterCount + potentialPrev;
            } else {
              shouldPreventDefault = false;
            }
          }
        }
        else if (isStatusFilter) {
          // ✅ Status Filter ကနေ အပေါ်တက်ရင် Category Filter ကို သွားမယ်
          const statusIndex = currentIndex - categoryCount; // 0, 1, or 2
          
          if (statusIndex === 0) {
            nextIndex = 0; // "All" ကနေ အပေါ် -> VN Server
          } else if (statusIndex === 1) {
            nextIndex = 0; // "Live" ကနေ အပေါ် -> VN Server
          } else {
            nextIndex = 1; // "Upcoming" ကနေ အပေါ် -> Myanmar Sound
          }
        } 
        else if (isCategoryFilter) {
          // ✅ Category Filter ကနေ အပေါ်တက်ရင် မသွားဘူး
          shouldPreventDefault = false;
        }
      } 
      else if (e.key === 'Enter' || e.key === 'Ok' || e.key === ' ') {
        e.preventDefault();
        currentElement.click();
        return;
      } 
      else {
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
        const firstFocusable = document.querySelector('.focusable-item');
        if (firstFocusable) {
          firstFocusable.focus();
          hasInitialFocused.current = true;
        }
      }, 500);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMatch, selectedCategory, selectedStatus, matches.length]);

  // 🎯 ၂။ Data Fetching Logic
  useEffect(() => {
    const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
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

        setMatches(processedMatches);
        const liveCount = processedMatches.filter(m => m.matchStatus).length;
        const upcomingCount = processedMatches.filter(m => !m.matchStatus).length;
        
        setCategoryCounts(prev => ({ ...prev, [selectedCategory]: processedMatches.length }));
        setStatuses([
          { id: 'all', name: 'All', count: processedMatches.length },
          { id: 'live', name: 'Live', count: liveCount },
          { id: 'upcoming', name: 'Upcoming', count: upcomingCount },
        ]);
      } catch (error) {
        console.error("❌ Fetch Error:", error);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchData(false);
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

      // 🎯 ၃။ Click Handlers (Step အလိုက် တိတိကျကျ ထိန်းချုပ်ထားသည်)
  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    lastFocusedMatchId.current = match.id;
    // Step 1: Modal ဖွင့်လိုက်ပြီ
    window.history.pushState({ step: 1 }, '');
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
    
  };

      const handleClosePlayer = () => {
    // ၁။ UI State ကို ချက်ချင်းရှင်းမယ်
    setSelectedMatch(null);
    setActiveLink(null);
    
    // ၂။ History ကို ၁ ဆင့်တည်း ပြန်ဆုတ်မယ် (Step 1 ကနေ Homepage ကို တန်းသွားမယ်)
    window.history.back(); 
    
    // ၃။ MatchCard ကို Focus ပြန်ပေးမယ်
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

        // 🎯 ၄။ Browser/Mobile Back Button Listener (၁ ချက်တည်းနဲ့ ပိတ်အောင် ပြင်ဆင်ထားသည်)
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      
      // ✅ Homepage (Root) ကို ရောက်သွားပြီလား စစ်ဆေးခြင်း
      const isRoot = !state || state.step === undefined || state.step === null;

      if (isRoot) {
        // Homepage ကို ရောက်ပြီဆိုရင် Modal ကို အပြီးတိုင်ပိတ်မယ်
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
      // ✅ Step 1 (Modal) မှာ ရှိနေသေးရင် ဘာမှမလုပ်ဘူး (Modal ဆက်ဖွင့်ထားမယ်)
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); 
  const filteredMatches = matches.filter(match => {
    if (selectedStatus === 'live') return match.matchStatus === true;
    if (selectedStatus === 'upcoming') return match.matchStatus === false;
    return true;
  });

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