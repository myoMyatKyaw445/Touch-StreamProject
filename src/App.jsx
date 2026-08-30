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

    // 🎯 ၁။ Keyboard Navigation Logic (Fixed ArrowUp for Status Filter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (window.innerWidth < 768 || selectedMatch) return;

      const mainFocusables = Array.from(document.querySelectorAll('.main-content .focusable-item'));
      const navFocusables = Array.from(document.querySelectorAll('.bottom-nav .focusable-item'));
      const allFocusables = [...mainFocusables, ...navFocusables];
      
      if (allFocusables.length === 0) return;

      const currentElement = document.activeElement;
      const currentIndex = allFocusables.indexOf(currentElement);

      if (currentIndex === -1) {
        allFocusables[0].focus();
        return;
      }

      let nextIndex = currentIndex;
      let shouldPreventDefault = true;
      
      // Grid Column တွက်ချက်ခြင်း (Match Cards အတွက်သာ)
      let gridColumns = 1;
      if (window.innerWidth >= 1024) gridColumns = 4;
      else if (window.innerWidth >= 768) gridColumns = Math.floor(window.innerWidth / 260);

      // Zone ခွဲခြားခြင်း
      const categoryCount = 2; // VN Server, မြန်မာအသံ
      const statusCount = 3; // All, Live, Upcoming
      const topSectionCount = categoryCount + statusCount; // 5

      if (e.key === 'ArrowRight') {
        if (currentIndex < allFocusables.length - 1) nextIndex = currentIndex + 1;
        else shouldPreventDefault = false;
      } 
      else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) nextIndex = currentIndex - 1;
        else shouldPreventDefault = false;
      } 
            else if (e.key === 'ArrowDown') {
        const isMatchCard = currentIndex >= topSectionCount;
        const isStatusFilter = currentIndex >= categoryCount && currentIndex < topSectionCount;
        const isCategoryFilter = currentIndex < categoryCount;

        if (isMatchCard) {
          // Match Card ကနေ အောက်ဆက်မယ်
          const matchCards = mainFocusables.slice(topSectionCount);
          const currentCardIndex = currentIndex - topSectionCount;
          const isLastRowInCards = currentCardIndex >= matchCards.length - gridColumns;
          
          if (isLastRowInCards) {
            nextIndex = mainFocusables.length; // Bottom Nav
          } else {
            const potentialNext = currentIndex + gridColumns;
            if (potentialNext < allFocusables.length) nextIndex = potentialNext;
            else shouldPreventDefault = false;
          }
        } 
        else if (isStatusFilter) {
          // ✅ Status Filter (All, Live, Upcoming) ကနေ Down နှိပ်ရင် Match Card ကို တိုက်ရိုက်သွားမယ်
          const statusIndex = currentIndex - categoryCount; // 0, 1, or 2
          // ပထမဆုံး Match Card Row ကို သွားမယ်
          // Status Filter ရဲ့ column position အရ ပထမဆုံး Match Card ကို ရွေးမယ်
          nextIndex = topSectionCount + statusIndex;
          
          // အကယ်၍ Match Card မရှိရင် Bottom Nav ကို သွားမယ်
          if (nextIndex >= allFocusables.length) {
            nextIndex = mainFocusables.length;
          }
        }
        else if (isCategoryFilter) {
          // Category Filter ကနေ Down နှိပ်ရင် Status Filter ကို သွားမယ်
          nextIndex = categoryCount; // "All" button ကို သွားမယ်
        }
      }
      else if (e.key === 'ArrowUp') {
        // ✅ ပြင်ဆင်ထားသော အပိုင်း
        const isMatchCard = currentIndex >= topSectionCount;
        const isStatusFilter = currentIndex >= categoryCount && currentIndex < topSectionCount;
        const isCategoryFilter = currentIndex < categoryCount;

        if (isMatchCard) {
          // Match Card ကနေ အပေါ်တက်မယ်
          const matchCards = mainFocusables.slice(topSectionCount);
          const currentCardIndex = currentIndex - topSectionCount;
          
          if (currentCardIndex - gridColumns >= 0) {
            nextIndex = currentIndex - gridColumns;
          } else {
            // Match Card ရဲ့ ပထမ Row ကနေ အပေါ်တက်ရင် Status Filter ကို သွားမယ်
            // ဘယ် Match Card column မှာ ရောက်နေလဲဆိုတာ ကြည့်မယ်
            const colIndex = currentCardIndex % gridColumns;
            // Status Filter ရဲ့ အလယ်ဗဟို (Index 3 - Live) ကို သွားမယ် (သို့မဟုတ်) နီးစပ်ရာ
            nextIndex = categoryCount + Math.min(colIndex, statusCount - 1);
          }
        } 
        else if (isStatusFilter) {
          // Status Filter (All, Live, Upcoming) ကနေ အပေါ်တက်ရင် Category Filter ကို သွားမယ်
          const statusIndex = currentIndex - categoryCount; // 0, 1, or 2
          
          if (statusIndex === 0) {
            // "All" (ပထမဆုံး) ကနေ အပေါ်တက်ရင် -> VN Server (Index 0)
            nextIndex = 0;
          } else if (statusIndex === 1) {
            // "Live" (ဒုတိယ) ကနေ အပေါ်တက်ရင် -> VN Server (Index 0) သို့မဟုတ် မြန်မာအသံ (Index 1)
            nextIndex = 0; // VN Server ကို းစားပေး
          } else {
            // "Upcoming" (တတိယ) ကနေ အပေါ်တက်ရင် -> မြန်မာအသံ (Index 1)
            nextIndex = 1;
          }
        } 
        else if (isCategoryFilter) {
          // Category Filter ကနေ အပေါ်တက်ရင် မသွားဘူး (သို့မဟုတ်) ပထမဆုံးကိုပဲ ထားမယ်
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

      if (shouldPreventDefault) {
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

  // 🎯 ၂။ ✅ Back Button (History) Navigation Logic (ဒါက မင်းလိုချင်တဲ့ Flow အတိုင်း အလုပ်လုပ်ပါလိမ့်မယ်)
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      
      if (state?.page === 'links') {
        // Video Player ကိုပိတ်ပြီး Link ရွေးတဲ့အဆင့်ကို ပြန်ရောက်မယ်
        setActiveLink(null);
      } else {
        // Link ရွေးတဲ့အဆင့်ကနေ ထပ်ထွက်ရင် Homepage ကို ပြန်ရောက်မယ်
        setSelectedMatch(null);
        setActiveLink(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 🎯 ၃။ Data Fetching Logic
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

  // 🎯 ၄။ Click Handlers
  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    window.history.pushState({ page: 'links' }, '');
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
    window.history.pushState({ page: 'video' }, '');
  };

  const handleClosePlayer = () => {
    window.history.back();
  };

  const filteredMatches = matches.filter(match => {
    if (selectedStatus === 'live') return match.matchStatus === true;
    if (selectedStatus === 'upcoming') return match.matchStatus === false;
    return true;
  });

  return (
    <div className="app">
      <Header />
      <main className="main-content">
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