import React, { useState, useCallback, useRef, useEffect } from 'react';
import VisionTracker from './components/VisionTracker';
import AssistantPanel from './components/AssistantPanel';
import TipsModal from './components/TipsModal';
import { GestureMode, Point } from './types';

// Matching the visual descriptions of the attached images
const SCENIC_IMAGES = [
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2600&auto=format&fit=crop", // Red Tree / Nature
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2600&auto=format&fit=crop", // Golden Hour Field (Updated Link)
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2600&auto=format&fit=crop", // Green Mountain Valley
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=2600&auto=format&fit=crop", // Lavender Field
  "https://images.unsplash.com/photo-1509043759401-136742328bb3?q=80&w=2600&auto=format&fit=crop", // Solitary Tree Sunset
];

function App() {
  const [mode, setMode] = useState<GestureMode>(GestureMode.IDLE);
  const [history, setHistory] = useState<Point[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showTips, setShowTips] = useState(true); // Default to showing tips
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Cursor State
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [clickEffect, setClickEffect] = useState<{x: number, y: number, id: number} | null>(null);

  // Linear Sensitivity: Optimized for a "weighted" feel
  const SENSITIVITY = 2500; 

  const handleScroll = useCallback((deltaY: number) => {
    if (scrollContainerRef.current && deltaY !== 0) {
        scrollContainerRef.current.scrollBy({
            top: -deltaY * SENSITIVITY,
            behavior: 'auto' 
        });
    }
  }, []);

  const handleCursorMove = useCallback((normX: number, normY: number) => {
      // Map normalized coordinates (0-1) to viewport pixels
      // Add a slight multiplier to reach edges easily (1.1x)
      const x = Math.min(Math.max(normX * window.innerWidth, 0), window.innerWidth);
      const y = Math.min(Math.max(normY * window.innerHeight, 0), window.innerHeight);
      setCursorPos({ x, y });
  }, []);

  const handleClick = useCallback(() => {
    // 1. Visual Ripple Effect
    setClickEffect({ x: cursorPos.x, y: cursorPos.y, id: Date.now() });
    setTimeout(() => setClickEffect(null), 500);

    // 2. Perform Click on Element
    const element = document.elementFromPoint(cursorPos.x, cursorPos.y);
    if (element) {
        // Dispatch standard click event
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: cursorPos.x,
            clientY: cursorPos.y
        });
        element.dispatchEvent(clickEvent);
    }
  }, [cursorPos]);

  const getStatusColor = () => {
    switch (mode) {
      case GestureMode.SCROLLING: return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
      case GestureMode.POINTING: return 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
      case GestureMode.CLICKING: return 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
      case GestureMode.TRANSITION: return 'bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]';
      case GestureMode.RESETTING: return 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]';
      case GestureMode.HAND_DETECTED: return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = () => {
    if (mode === GestureMode.POINTING) return 'CURSOR ACTIVE';
    if (mode === GestureMode.CLICKING) return 'CLICK DETECTED!';
    if (mode === GestureMode.TRANSITION) return 'RESTABILIZING...';
    
    const lastPoint = history[history.length - 1];
    const orient = lastPoint?.orientation || 'neutral';

    if (mode === GestureMode.SCROLLING) {
        if (orient === 'horizontal') return 'ACTIVE: SCROLL UP';
        if (orient === 'vertical') return 'ACTIVE: SCROLL DOWN';
        return 'SCROLLING...';
    }
    if (mode === GestureMode.HAND_DETECTED) {
        return 'HAND DETECTED - EXTEND 2 FINGERS TO SCROLL';
    }
    if (mode === GestureMode.IDLE && history.length > 0) {
        if (orient === 'horizontal') return 'READY: PULL DOWN';
        if (orient === 'vertical') return 'READY: PUSH UP';
    }
    return 'NO HAND DETECTED';
  };

  // Content for the "Long Webpage"
  const articles = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    category: i % 2 === 0 ? 'NATURE' : 'PHOTOGRAPHY',
    title: [
      "The Scarlet Canopy",
      "Golden Hour Meadows",
      "Valley of Serenity",
      "Lavender Dreams",
      "Solitude in Light",
      "Autumn's Embrace",
      "Floral Horizons",
      "Mountain Whispers",
      "Purple Haze",
      "Sunset Silhouettes"
    ][i],
    readTime: `${3 + i} min read`,
    image: SCENIC_IMAGES[i % SCENIC_IMAGES.length]
  }));

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-slate-100 overflow-hidden relative font-sans selection:bg-blue-500/30">
      
      {/* Visual Cursor Overlay */}
      {(mode === GestureMode.POINTING || mode === GestureMode.CLICKING) && (
        <div 
            className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-out"
            style={{ 
                left: 0, 
                top: 0,
                transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)` 
            }}
        >
            <div className={`w-8 h-8 -ml-4 -mt-4 border-2 rounded-full flex items-center justify-center
                ${mode === GestureMode.CLICKING ? 'border-red-500 scale-90' : 'border-blue-400 scale-100'} 
                bg-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all`}
            >
                <div className={`w-1 h-1 bg-white rounded-full ${mode === GestureMode.CLICKING ? 'bg-red-400' : ''}`} />
            </div>
        </div>
      )}

      {/* Click Ripple Effect */}
      {clickEffect && (
        <div 
            className="fixed z-[9998] pointer-events-none w-12 h-12 rounded-full border-2 border-red-500 animate-ping"
            style={{ 
                left: clickEffect.x - 24, 
                top: clickEffect.y - 24 
            }} 
        />
      )}

      {/* Background Ambient Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Area */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto h-full z-10 relative scrollbar-hide"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-black/50 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-sm transform rotate-45"></div>
            <span className="font-bold tracking-tight text-lg">Aether<span className="text-slate-500">Scroll</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowTips(true)}
                className="text-xs font-bold font-mono text-emerald-950 bg-emerald-500 border border-emerald-400 px-4 py-2 rounded-full hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse"
             >
                HELP / GESTURES
             </button>
             <div className="text-xs font-mono text-slate-500 hidden md:block">
               V 2.2.1
             </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="min-h-[90vh] flex flex-col justify-center items-center text-center px-4 relative border-b border-white/5">
           <div className="max-w-4xl space-y-8 animate-fade-in-up">
              <div className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-4">
                System Online
              </div>
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-600 leading-[0.9]">
                TOUCH<br/>NOTHING.
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
                Experience the first zero-latency, orientation-aware scrolling engine powered by edge-based computer vision.
              </p>
              
              <button 
                 onClick={() => setShowTips(true)}
                 className="mt-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-1 border border-emerald-400/50"
              >
                 View Gesture Guide
              </button>
           </div>
           
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
             <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
             <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Scroll to Explore</span>
           </div>
        </header>

        {/* Technical Features */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
             <div className="mb-20">
               <h2 className="text-4xl font-bold mb-4">Core Architecture</h2>
               <div className="h-1 w-20 bg-blue-500"></div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'MediaPipe Vision', desc: 'Real-time hand landmark detection running at 60fps on the GPU.' },
                  { title: 'Gemini Analysis', desc: 'Semantic understanding of gesture intent and trajectory quality.' },
                  { title: 'Adaptive Physics', desc: 'Dynamic low-pass filters that eliminate micro-jitter while preserving responsiveness.' }
                ].map((item, i) => (
                  <div key={i} className="group p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                     <div className="w-12 h-12 bg-slate-800 rounded-full mb-6 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <span className="font-mono font-bold">{i + 1}</span>
                     </div>
                     <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                     <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Content Feed (Scroll Demo) */}
        <section className="py-20 px-6 bg-black/40 border-t border-white/5">
           <div className="max-w-4xl mx-auto space-y-16">
              <div className="flex items-center justify-between mb-12">
                 <h2 className="text-3xl font-bold">Visual Gallery</h2>
                 <span className="text-slate-500 font-mono text-sm">INTERACTIVE FEED</span>
              </div>

              {articles.map((article) => (
                <article key={article.id} className="group relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                  <div className="relative bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
                    
                    {/* Clickable Image Container */}
                    <div 
                        className="h-80 md:h-[400px] bg-slate-800 relative overflow-hidden cursor-pointer"
                        onClick={() => setSelectedImage(article.image)}
                    >
                       <img 
                         src={article.image} 
                         alt={article.title}
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                       />
                       <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                            </div>
                       </div>
                    </div>

                    <div className="p-8">
                       <div className="flex items-center gap-4 mb-4 text-xs font-mono uppercase tracking-wider text-slate-500">
                          <span className="text-blue-400">{article.category}</span>
                          <span>•</span>
                          <span>{article.readTime}</span>
                       </div>
                       <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-blue-100 transition-colors">{article.title}</h3>
                       <p className="text-slate-400 leading-relaxed mb-6">
                         Experience the vivid details of {article.title.toLowerCase()}. Use your gestures to scroll through this gallery, or click on any frame to enter immersive mode.
                       </p>
                       <button 
                         className="flex items-center gap-2 text-sm font-bold text-white group-hover:text-blue-400 transition-colors"
                         onClick={() => setSelectedImage(article.image)}
                       >
                          View Fullscreen <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                       </button>
                    </div>
                  </div>
                </article>
              ))}
              
              <div className="py-20 text-center space-y-4">
                 <div className="w-16 h-16 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                 <p className="text-slate-500 font-mono text-xs">LOADING MORE DATA...</p>
              </div>
           </div>
        </section>

        <footer className="py-12 border-t border-white/5 text-center text-slate-600 text-sm">
           <p>© 2025 GestureScroll AI. All systems nominal.</p>
        </footer>
      </div>

      {/* Floating HUD Controls */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-4">
        {/* Camera Feed Container */}
        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl opacity-30 blur group-hover:opacity-50 transition-opacity duration-500"></div>
           <VisionTracker 
             onScroll={handleScroll} 
             onGestureChange={setMode} 
             onHistoryUpdate={setHistory} 
             onCursorMove={handleCursorMove}
             onClick={handleClick}
           />
        </div>
        
        {/* Status Panel */}
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[300px] overflow-hidden relative">
           <div className={`w-2 h-full absolute left-0 top-0 ${getStatusColor()} transition-colors duration-300 opacity-50`}></div>
           <div className={`w-3 h-3 rounded-full ${getStatusColor()} transition-colors duration-300 ml-2`}></div>
           <div className="flex-1 min-w-0">
             <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">System Status</div>
             <div className="font-mono text-sm font-bold text-white truncate typing-effect">{getStatusText()}</div>
           </div>
           
           {/* Animated decorative bits */}
           <div className="flex gap-0.5 items-end h-4 opacity-30">
              <div className="w-1 bg-white h-2 animate-pulse"></div>
              <div className="w-1 bg-white h-4 animate-pulse delay-75"></div>
              <div className="w-1 bg-white h-1 animate-pulse delay-150"></div>
           </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <AssistantPanel 
        history={history} 
        isExpanded={isAssistantOpen} 
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)} 
      />

      {/* Tips Modal */}
      {showTips && <TipsModal onClose={() => setShowTips(false)} />}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fade-in"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative max-w-7xl w-full h-full flex items-center justify-center pointer-events-none">
                <img 
                    src={selectedImage} 
                    alt="Fullscreen view" 
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                />
                {/* Close Button - Made prominent for clicking */}
                <button 
                    className="absolute top-4 right-4 text-white hover:text-red-400 bg-black/50 hover:bg-black/80 rounded-full p-4 transition-all pointer-events-auto border border-white/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                    }}
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>

    </div>
  );
}

export default App;