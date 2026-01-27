import React from 'react';

interface TipsModalProps {
  onClose: () => void;
}

const TipsModal: React.FC<TipsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      {/* Internal styles for hand animations */}
      <style>{`
        /* Unidirectional Swipe Up: Start low, move up, fade out */
        @keyframes hand-swipe-up {
          0% { transform: translateY(25px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-25px); opacity: 0; }
        }
        
        /* Unidirectional Swipe Down: Start high, move down, fade out */
        @keyframes hand-swipe-down {
          0% { transform: translateY(-25px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(25px); opacity: 0; }
        }

        @keyframes hand-push {
          0%, 100% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        .animate-hand-up { animation: hand-swipe-up 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
        .animate-hand-down { animation: hand-swipe-down 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
        .animate-hand-push { animation: hand-push 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        /* Sync arrows with hands */
        .animate-arrow-up { animation: hand-swipe-up 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
        .animate-arrow-down { animation: hand-swipe-down 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-50 p-2 hover:bg-white/10 rounded-full"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Gesture Control Guide</h2>
            <p className="text-slate-400 text-lg">Master the contactless controls to explore the gallery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pb-4 relative z-10">
          
          {/* Card 1: Scroll Down (Vertical Fingers) */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col items-center text-center hover:border-emerald-500/50 transition-colors group">
            <div className="w-48 h-48 bg-slate-800 rounded-full mb-6 relative flex items-center justify-center border border-slate-700 group-hover:bg-slate-800/80 transition-colors shadow-inner">
               {/* Hand Sideways (Vertical Alignment) - Realistic Silhouette */}
               <svg width="140" height="140" viewBox="0 0 200 200" className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Glow behind fingers */}
                  <circle cx="100" cy="100" r="60" fill="currentColor" fillOpacity="0.05" className="animate-pulse" />
                  
                  {/* Animated Hand Group */}
                  <g className="animate-hand-up origin-center">
                    <g transform="translate(100, 100) rotate(-90) translate(-100, -100)">
                        {/* Palm and Fingers Base */}
                        <path d="M70 180 L70 100 Q70 90 80 90 L120 90 Q130 90 130 100 L130 180" 
                              fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
                        
                        {/* Index Finger (Top in sideways view) */}
                        <rect x="102" y="30" width="26" height="70" rx="12" 
                              fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
                        {/* Nail */}
                        <path d="M110 38 Q115 35 120 38 L120 45 Q115 48 110 45 Z" fill="currentColor" fillOpacity="0.4" />

                        {/* Middle Finger (Bottom in sideways view) */}
                        <rect x="72" y="30" width="26" height="70" rx="12" 
                              fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
                        {/* Nail */}
                        <path d="M80 38 Q85 35 90 38 L90 45 Q85 48 80 45 Z" fill="currentColor" fillOpacity="0.4" />
                    </g>
                  </g>

                  {/* Alignment Line (Vertical) */}
                  <line x1="100" y1="40" x2="100" y2="160" stroke="white" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                  
                  {/* Movement Arrow (UP) */}
                  <path d="M160 120 L160 80" stroke="white" strokeWidth="4" fill="none" markerEnd="url(#arrow-up-real)" className="animate-arrow-up" />
                  
                  <defs>
                    <marker id="arrow-up-real" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L6,3 z" fill="white" />
                    </marker>
                  </defs>
               </svg>
            </div>
            <h3 className="text-xl font-bold text-emerald-400 mb-2">Scroll Down</h3>
            <div className="text-sm text-slate-300">
                <p className="mb-2">Turn hand <span className="font-bold text-white">SIDEWAYS</span>.</p>
                <p className="text-xs text-slate-400 mb-3">Index finger stacked above Middle finger.</p>
                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-400 px-3 py-1 rounded-full">MOVE HAND UP</span>
            </div>
          </div>

          {/* Card 2: Scroll Up (Horizontal Fingers) */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors group">
            <div className="w-48 h-48 bg-slate-800 rounded-full mb-6 relative flex items-center justify-center border border-slate-700 group-hover:bg-slate-800/80 transition-colors shadow-inner">
               {/* Hand Upright (Horizontal Alignment) - Realistic Silhouette */}
               <svg width="140" height="140" viewBox="0 0 200 200" className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                   {/* Glow */}
                   <circle cx="100" cy="100" r="60" fill="currentColor" fillOpacity="0.05" className="animate-pulse" />

                   {/* Animated Hand Group */}
                   <g className="animate-hand-down origin-center">
                     <g transform="translate(0, 10)">
                          {/* Palm */}
                         <path d="M60 180 L60 110 Q60 100 70 100 L130 100 Q140 100 140 110 L140 180" 
                               fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
                         
                         {/* Middle Finger */}
                         <rect x="105" y="40" width="28" height="75" rx="12" 
                               fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
                         {/* Nail */}
                         <path d="M114 48 Q119 45 124 48 L124 55 Q119 58 114 55 Z" fill="currentColor" fillOpacity="0.4" />

                         {/* Index Finger */}
                         <rect x="67" y="40" width="28" height="75" rx="12" 
                               fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
                          {/* Nail */}
                         <path d="M76 48 Q81 45 86 48 L86 55 Q81 58 76 55 Z" fill="currentColor" fillOpacity="0.4" />
                     </g>
                   </g>

                   {/* Alignment Line (Horizontal) */}
                   <line x1="40" y1="90" x2="160" y2="90" stroke="white" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

                   {/* Movement Arrow (DOWN) */}
                   <path d="M170 110 L170 150" stroke="white" strokeWidth="4" fill="none" markerEnd="url(#arrow-down-real)" className="animate-arrow-down" />

                   <defs>
                    <marker id="arrow-down-real" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L6,3 z" fill="white" />
                    </marker>
                  </defs>
               </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-400 mb-2">Scroll Up</h3>
             <div className="text-sm text-slate-300">
                <p className="mb-2">Hold hand <span className="font-bold text-white">UPRIGHT</span>.</p>
                <p className="text-xs text-slate-400 mb-3">Fingers side-by-side (like Peace sign).</p>
                <span className="font-mono text-xs font-bold text-blue-950 bg-blue-400 px-3 py-1 rounded-full">MOVE HAND DOWN</span>
            </div>
          </div>

          {/* Card 3: Click (One Finger) */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col items-center text-center hover:border-red-500/50 transition-colors group">
            <div className="w-48 h-48 bg-slate-800 rounded-full mb-6 relative flex items-center justify-center border border-slate-700 group-hover:bg-slate-800/80 transition-colors shadow-inner">
                {/* One Finger Pointing SVG */}
               <svg width="140" height="140" viewBox="0 0 200 200" className="text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]">
                  {/* Glow */}
                  <circle cx="100" cy="100" r="60" fill="currentColor" fillOpacity="0.05" className="animate-pulse" />

                  {/* Animated Hand Group */}
                  <g className="animate-hand-push origin-center">
                    <g transform="translate(0, 20)">
                         {/* Palm Body */}
                        <path d="M60 180 L60 120 Q60 100 80 100 L120 100 Q140 100 140 120 L140 180" 
                              fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
                        
                        {/* Folded Fingers (Middle, Ring, Pinky) - Corrected Graphic */}
                        <path d="M110 100 L110 145 Q110 155 120 155 L135 155 Q140 155 140 145 L140 110" 
                              fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
                        <line x1="110" y1="120" x2="140" y2="120" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
                        <line x1="110" y1="138" x2="140" y2="138" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />

                        {/* Index Finger (Extended) */}
                        <rect x="75" y="30" width="30" height="95" rx="15" 
                              fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
                         {/* Nail */}
                        <path d="M85 38 Q90 35 95 38 L95 48 Q90 51 85 48 Z" fill="currentColor" fillOpacity="0.4" />
                    </g>
                  </g>
                  
                  {/* Ripple Ring at Tip */}
                  <circle cx="90" cy="60" r="25" stroke="white" strokeWidth="2" fill="none" className="animate-ping opacity-60" />

                  {/* Push Arrow (Forward/Z-axis) */}
                  <path d="M160 80 L140 60" stroke="white" strokeWidth="3" fill="none" markerEnd="url(#arrow-push-real)" />
                  <text x="170" y="95" textAnchor="middle" fill="#fca5a5" fontSize="12" className="font-mono font-bold">PUSH</text>

                   <defs>
                    <marker id="arrow-push-real" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L6,3 z" fill="white" />
                    </marker>
                  </defs>
               </svg>
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Click / Select</h3>
             <div className="text-sm text-slate-300">
                <p className="mb-2">Use <span className="font-bold text-white bg-red-500/20 px-2 py-0.5 rounded">ONE FINGER</span>.</p>
                <p className="text-xs text-slate-400 mb-3">Like pressing a physical button.</p>
                <span className="font-mono text-xs font-bold text-red-950 bg-red-400 px-3 py-1 rounded-full">PUSH FORWARD</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center z-10">
          <button 
            onClick={onClose}
            className="bg-white text-slate-900 hover:bg-slate-200 font-bold text-lg py-4 px-16 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105 active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default TipsModal;