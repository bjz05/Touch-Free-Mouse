import React, { useState, useEffect, useRef } from 'react';
import { analyzeTrajectory, askAssistant } from '../services/geminiService';
import { Point, ChatMessage } from '../types';

interface AssistantPanelProps {
  history: Point[];
  isExpanded: boolean;
  onToggle: () => void;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ history, isExpanded, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I can help you master the contactless controls. Ask me anything or click "Analyze" to check your technique.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await askAssistant(userMsg);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: 'Analyze my recent movement.' }]);
    
    // Pass a snapshot of history
    const feedback = await analyzeTrajectory(history);
    setMessages(prev => [...prev, { role: 'model', text: feedback }]);
    setLoading(false);
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-slate-800 border-l border-slate-700 transition-all duration-300 z-50 flex flex-col ${isExpanded ? 'w-80' : 'w-12'}`}>
      <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
        {isExpanded && <h2 className="font-bold text-blue-400">Gemini Assistant</h2>}
        <button onClick={onToggle} className="p-1 hover:bg-slate-700 rounded text-slate-400">
          {isExpanded ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          )}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-500 animate-pulse">Thinking...</div>}
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900">
             <div className="flex gap-2 mb-2">
               <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-2 rounded transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Analyze Move
              </button>
             </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Gemini..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssistantPanel;
