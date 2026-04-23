/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { Home, BookOpen, Plus, X, Calendar, Clock, Check, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

interface Task {
  id: string;
  title: string;
  dueDate: number; // timestamp
  confidence: number; // 1-5
  createdAt: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    due: "",
    time: "",
    confidence: 3
  });

  // STRICT DETERMINISTIC RANKING LOGIC
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // 1. Primary Sort: Confidence (ascending) - Lower confidence = Higher Priority
      if (a.confidence !== b.confidence) {
        return a.confidence - b.confidence;
      }
      
      // 2. Secondary Sort: Due Date (ascending) - Earlier date = Higher Priority
      return a.dueDate - b.dueDate;
    });
  }, [tasks]);

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const dateStr = newTask.due || new Date().toISOString().split('T')[0];
    const timeStr = newTask.time || "12:00";
    const dueTimestamp = new Date(`${dateStr}T${timeStr}`).getTime();

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      dueDate: dueTimestamp,
      confidence: newTask.confidence,
      createdAt: Date.now(),
    };

    setTasks([...tasks, task]);
    setShowModal(false);
    setNewTask({ title: "", due: "", time: "", confidence: 3 });
  };

  const handleCompleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const [studyPlan, setStudyPlan] = useState<{id: string, title: string, minutes: number}[]>([]);

  const generateStudyPlan = () => {
    try {
      const now = Date.now();
      const plan = sortedTasks.map(task => {
        const diffDays = (task.dueDate - now) / (1000 * 60 * 60 * 24);
        
        let confidenceMult = 1.0;
        if (task.confidence === 1) confidenceMult = 2.0;
        else if (task.confidence === 2) confidenceMult = 1.6;
        else if (task.confidence === 3) confidenceMult = 1.3;
        else if (task.confidence === 4) confidenceMult = 1.1;
        else if (task.confidence === 5) confidenceMult = 0.8;

        let urgencyMult = 1.0;
        if (diffDays <= 1) urgencyMult = 2.0;
        else if (diffDays <= 3) urgencyMult = 1.6;
        else if (diffDays <= 7) urgencyMult = 1.3;

        const rawMins = 30 * confidenceMult * urgencyMult;
        const roundedMins = Math.round(rawMins / 5) * 5;

        return {
          id: task.id,
          title: task.title,
          minutes: roundedMins
        };
      });
      setStudyPlan(plan);
      setHasGenerated(true);
    } catch (err) {
      console.error("Study plan generation error", err);
    }
  };

  const primaryTask = sortedTasks[0];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  const getTaskTheme = (index: number) => {
    const cycle = index % 3;
    if (cycle === 0) return { from: '#22c55e', to: '#4ade80', classes: "bg-green-500/10 text-white glow-green" };
    if (cycle === 1) return { from: '#3b82f6', to: '#60a5fa', classes: "bg-blue-500/10 text-white glow-blue" };
    return { from: '#a855f7', to: '#c084fc', classes: "bg-purple-500/10 text-white glow-purple" };
  };

  const ConfidenceDots = ({ level, theme, interactive = false, onSelect }: { level: number, theme: any, interactive?: boolean, onSelect?: (val: number) => void }) => {
    return (
      <div className={`${interactive ? 'mt-4' : 'mt-2.5'}`}>
        <span className={`uppercase tracking-wider text-slate-500/80 font-medium block ${interactive ? 'text-[10px] mb-3' : 'text-[9px] mb-2'}`}>
          Confidence Level
        </span>
        <div className="flex gap-2.5 px-0.5">
          {[1, 2, 3, 4, 5].map((dot, index) => {
            const isActive = dot <= level;
            return (
              <motion.div 
                key={dot}
                onClick={() => interactive && onSelect && onSelect(dot)}
                whileTap={interactive ? { scale: 0.8 } : {}}
                className={`rounded-full relative transition-all duration-300 ${interactive ? 'w-5 h-5 cursor-pointer' : 'w-1.5 h-1.5'}`}
                style={{
                  background: isActive 
                    ? `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` 
                    : 'rgba(255,255,255,0.08)'
                }}
              >
                {isActive && (
                  <div 
                    className={`absolute inset-0 rounded-full opacity-40 ${interactive ? 'blur-[10px]' : 'blur-[8px]'}`} 
                    style={{ backgroundColor: theme.from }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] font-sans text-white flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col min-h-screen relative pb-24">
        {/* 1. TOP HEADER BAR */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0">
          <div className="w-10 h-1 bg-white/10 rounded-full mx-auto" />
        </header>

        <motion.main 
          key={activeTab}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex-1 px-6 space-y-8"
        >
          {activeTab === "home" ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={tasks && tasks.length > 0 ? "active" : "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* 2. TODAY'S PRIORITY CARD */}
                <section>
                  <div className={`glass p-6 rounded-[24px] border-l-4 transition-all duration-500 relative overflow-hidden group ${primaryTask ? 'border-l-green-500/50 bg-gradient-to-br from-white/[0.04] to-transparent ring-1 ring-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]' : 'border-l-white/10 bg-white/[0.02] opacity-60'}`}>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3 block">
                      Today's Priority
                    </span>
                    <h1 className={`text-2xl font-bold tracking-tight leading-tight transition-all ${primaryTask ? 'text-white' : 'text-slate-500/80 italic font-medium'}`}>
                      {primaryTask ? primaryTask.title : "No tasks added"}
                    </h1>
                    {primaryTask && (
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-green-500/10 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </section>

                {/* 3. RANKED TASKS SECTION */}
                <section className="space-y-4">
                  <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold pl-1">
                    Ranked Tasks
                  </h2>
                  
                  {tasks && tasks.length > 0 ? (
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {sortedTasks && sortedTasks.map((task, index) => {
                          const theme = getTaskTheme(index);
                          const isRankOne = index === 0;
                          return (
                            <motion.div 
                              layout
                              key={task.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className={`glass p-4 rounded-[20px] flex items-center gap-4 transition-all hover:bg-white/[0.05] relative group ${isRankOne ? 'ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]' : ''}`}
                            >
                              <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${theme.classes} ${isRankOne ? 'scale-110' : ''}`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{task.title}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">Due {formatDueDate(task.dueDate)}</p>
                                <ConfidenceDots level={task.confidence} theme={theme} />
                              </div>
                              
                              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button 
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="p-2 glass rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                >
                                  <Check size={16} strokeWidth={3} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-2 glass rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass p-12 rounded-[24px] border-dashed flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="p-4 rounded-full bg-white/[0.03] text-slate-600">
                        <BookOpen size={32} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-400">No tasks yet.</p>
                        <p className="text-xs text-slate-600">Add your first task to get started.</p>
                      </div>
                    </motion.div>
                  )}
                </section>

                {/* 4. ADD TASK BUTTON */}
                <section>
                  <motion.button 
                    onClick={() => setShowModal(true)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full glass py-4 rounded-[20px] text-sm font-bold text-slate-300 border border-white/10 hover:border-blue-500/40 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} className="text-blue-400" />
                    Add Task
                  </motion.button>
                </section>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="space-y-8">
              <motion.section variants={itemVariants} className="text-center pt-4">
                <button 
                  onClick={tasks && tasks.length > 0 ? generateStudyPlan : undefined}
                  disabled={!tasks || tasks.length === 0}
                  className="glass px-8 py-5 rounded-[24px] text-sm font-bold bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30 hover:border-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.1)] group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock size={16} className="text-blue-400" />
                    </div>
                    Generate Recommended Study Plan
                  </div>
                </button>
                <p className="mt-3 text-[11px] font-medium text-slate-500/60 transition-all duration-500">
                  {hasGenerated 
                    ? "Updated based on your latest tasks" 
                    : "Tap again anytime to refresh your daily study plan"
                  }
                </p>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold pl-1">
                  Daily Allocation
                </h2>

                <div className="space-y-3">
                  {tasks && tasks.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {studyPlan && studyPlan.length > 0 ? (
                        studyPlan.map((rec, idx) => (
                          <motion.div 
                            key={rec.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass p-5 rounded-[20px] flex items-center justify-between group hover:bg-white/[0.05] transition-all"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                Recommended Session
                              </span>
                              <h3 className="text-sm font-semibold text-white tracking-tight">
                                {rec.title}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
                                {rec.minutes}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase ml-1.5 tracking-tighter">
                                Min
                              </span>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="glass p-8 rounded-[20px] text-center border-dashed opacity-50">
                          <p className="text-xs font-medium text-slate-400 italic">
                            Click generate to see your optimal daily distribution
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                  ) : (
                    <div className="glass p-8 rounded-[20px] text-center bg-red-500/5 border-red-500/10">
                      <p className="text-xs font-semibold text-red-400/80 uppercase tracking-widest">
                        Unable to generate study plan
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Please add tasks to calculate effort allocation</p>
                    </div>
                  )}
                </div>
              </motion.section>
            </div>
          )}
        </motion.main>

        {/* MODAL / BOTTOM SHEET */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md glass rounded-t-[32px] sm:rounded-[32px] p-8 space-y-6 overflow-hidden bg-[#0F0F15]"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Create New Task</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Task Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="What needs to be done?"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Due Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-blue-500/50 appearance-none transition-all"
                          value={newTask.due}
                          onChange={(e) => setNewTask({...newTask, due: e.target.value})}
                        />
                        <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Time</label>
                      <div className="relative">
                        <input 
                          type="time" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-blue-500/50 appearance-none transition-all"
                          value={newTask.time}
                          onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                        />
                        <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <ConfidenceDots 
                    interactive 
                    level={newTask.confidence} 
                    theme={{ from: '#3b82f6', to: '#60a5fa' }} 
                    onSelect={(val) => setNewTask({...newTask, confidence: val})} 
                  />

                  <button 
                    onClick={handleCreateTask}
                    disabled={!newTask.title.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] mt-2 flex items-center justify-center gap-2"
                  >
                    Create Task
                  </button>
                </div>

                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-20 glass border-t border-white/5 flex items-center justify-around px-8 pb-6 backdrop-blur-2xl z-50">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1.5 transition-colors duration-300 ${activeTab === "home" ? "text-blue-500" : "text-slate-500 hover:text-slate-400"}`}
          >
            <Home size={20} strokeWidth={activeTab === "home" ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            {activeTab === "home" && (
              <motion.div layoutId="tab-indicator" className="w-1 h-1 bg-blue-500 rounded-full" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab("study")}
            className={`flex flex-col items-center gap-1.5 transition-colors duration-300 ${activeTab === "study" ? "text-blue-500" : "text-slate-500 hover:text-slate-400"}`}
          >
            <BookOpen size={20} strokeWidth={activeTab === "study" ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Study Plan</span>
            {activeTab === "study" && (
              <motion.div layoutId="tab-indicator" className="w-1 h-1 bg-blue-500 rounded-full" />
            )}
          </button>
          
          <div className="absolute bottom-1.5 w-32 h-1 bg-white/10 rounded-full" />
        </nav>
      </div>
    </div>
  );
}


