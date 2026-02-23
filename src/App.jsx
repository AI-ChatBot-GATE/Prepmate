import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Calendar, BookOpen, User, Bot, Info, Clock, CheckCircle, List, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
// We now point to our local backend instead of the direct Gemini API
const BACKEND_URL = "http://localhost:5000";

const App = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: "System connected. I'm your GATE AI Tutor linked to MongoDB. Ready to start our session?", 
      type: 'standard' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isExamMode, setIsExamMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const scrollRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Fetch study schedule from MongoDB on load
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/schedule`);
        const data = await res.json();
        if (Array.isArray(data)) setSchedule(data);
      } catch (err) {
        console.error("Could not load schedule from backend.");
      }
    };
    fetchSchedule();
  }, []);

  /**
   * TALK TO BACKEND: This function sends your message to the Node server
   */
  const callBackendAI = async (userQuery) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userQuery, 
          isExamMode: isExamMode 
        })
      });

      const data = await response.json();
      return data.reply || "Connection successful, but the brain is quiet. Try again?";
    } catch (error) {
      return "Backend Error: Make sure your server is running on port 5000 and MongoDB is connected.";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const aiReply = await callBackendAI(input);
    
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: 'assistant',
      content: aiReply,
      type: isExamMode ? 'exam' : 'standard'
    }]);
    setIsTyping(false);
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 ${isExamMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 border-r ${isExamMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-inherit">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isExamMode ? 'bg-red-600' : 'bg-blue-600'}`}>
            <Zap className="text-white size-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">GATE AI</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Full Stack Engine</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="px-3 text-[10px] font-bold uppercase opacity-40 mb-3">Planner</h3>
            <div className="space-y-1">
              <NavItem 
                icon={<Calendar size={18}/>} 
                label="Study Schedule" 
                active={showSchedule} 
                onClick={() => setShowSchedule(!showSchedule)}
              />
              <NavItem icon={<BookOpen size={18}/>} label="Concept Map" />
              <NavItem icon={<Clock size={18}/>} label="Practice Arena" />
            </div>
          </section>

          {showSchedule && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-2 space-y-2"
            >
              <div className="text-[11px] font-semibold opacity-60 mb-1 flex justify-between items-center">
                <span>MONGODB TASKS</span>
                <Plus size={14} className="cursor-pointer hover:text-blue-500" />
              </div>
              {schedule.length === 0 ? (
                <p className="text-[10px] italic opacity-40">No tasks synced yet.</p>
              ) : (
                schedule.map((item, idx) => (
                  <div key={idx} className="p-2 bg-black/5 rounded-lg text-[11px] border border-inherit">
                    {item.topic}
                  </div>
                ))
              )}
            </motion.div>
          )}

          <section className={`p-4 rounded-2xl border ${isExamMode ? 'bg-red-950/20 border-red-500/30' : 'bg-blue-50 border-blue-100'}`}>
             <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase">Exam Mode</span>
                <button 
                  onClick={() => setIsExamMode(!isExamMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isExamMode ? 'bg-red-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isExamMode ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
             <p className="text-[10px] opacity-70">
               Direct PYQ flow from DB activated.
             </p>
          </section>
        </div>

        <div className="p-4 border-t border-inherit">
           <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg text-green-600 text-[10px] font-bold uppercase">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Connected to MongoDB
           </div>
        </div>
      </aside>

      {/* Main Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 px-6 flex items-center justify-between border-b ${isExamMode ? 'border-slate-800 bg-slate-950/50' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">GATE Pedagogy</span>
            <span className="text-sm font-semibold">{isExamMode ? "Exam Simulation" : "Socratic Mentoring"}</span>
          </div>
          <button className="p-2 hover:bg-black/5 rounded-lg"><Info size={18}/></button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : (isExamMode ? 'bg-red-600 text-white' : 'bg-slate-800 text-white')
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block text-left p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : (isExamMode ? 'bg-slate-900 border border-red-900/50 text-slate-100 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none')
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-4 items-center pl-2">
                <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className={`p-4 md:p-6 border-t ${isExamMode ? 'border-slate-800 bg-slate-950/50' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isExamMode ? "Your answer..." : "Ask a concept or for your schedule..."}
              className={`w-full pl-6 pr-14 py-4 rounded-2xl border outline-none transition-all text-sm ${
                isExamMode 
                ? 'bg-slate-900 border-slate-700 text-white focus:border-red-500' 
                : 'bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:shadow-xl'
              }`}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`absolute right-2.5 top-2.5 bottom-2.5 px-4 rounded-xl transition-all ${
                isExamMode ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              } shadow-lg active:scale-95 disabled:opacity-50`}
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-4 flex justify-center gap-8 opacity-40 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2"><CheckCircle size={10}/> MERN STACK</span>
            <span className="flex items-center gap-2"><List size={10}/> GATE AI v1.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-medium ${
      active ? 'bg-blue-600/10 text-blue-600' : 'hover:bg-slate-50 opacity-60'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;