
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';
import { AppState, TaskCategory, Task, Subject } from '../types';
import { CheckCircle, Clock, Book, Activity, ArrowLeft, AlertTriangle, ShieldCheck, CheckSquare, Plus, Save, Timer, Flame, Check } from 'lucide-react';
import { MOTIVATIONAL_QUOTES } from '../constants';

interface DashboardProps {
  state: AppState;
  setTasks: (tasks: Task[]) => void;
  setSubjects: (subjects: Subject[]) => void;
}

type DashboardView = 'overview' | 'tasks' | 'questions' | 'topics' | 'hours';

const Dashboard: React.FC<DashboardProps> = ({ state, setTasks, setSubjects }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  // Lifted state for Hours View to prevent hook rule violation
  const [manualHours, setManualHours] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  
  const isAdmin = state.userRole === 'admin';

  // --- Calculations ---
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const totalQuestions = state.subjects.reduce((acc, sub) => 
    acc + sub.chapters.reduce((cAcc, chap) => cAcc + chap.questionsSolved, 0), 0
  );
  
  const totalTopics = state.subjects.reduce((acc, sub) => 
    acc + sub.chapters.reduce((cAcc, chap) => cAcc + chap.topicsTotal, 0), 0
  );
  
  const coveredTopics = state.subjects.reduce((acc, sub) => 
    acc + sub.chapters.reduce((cAcc, chap) => cAcc + chap.topicsCovered, 0), 0
  );

  const topicCompletion = totalTopics === 0 ? 0 : Math.round((coveredTopics / totalTopics) * 100);

  const studyHoursToday = state.tasks
    .filter(t => t.category === TaskCategory.STUDY && t.completed)
    .reduce((acc, t) => acc + (t.duration || 0), 0) / 60;

  // --- Streak Calculations ---
  // Generate last 7 days array
  const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
  });

  // --- Sub-Component: Task Command Center ---
  const renderTaskView = () => {
    const overdueTasks = state.tasks.filter(t => 
      !t.completed && t.deadline && new Date(t.deadline).getTime() < Date.now()
    );
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

    const toggleTask = (id: string) => {
        setTasks(state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const adminTasks = state.tasks.filter(t => t.createdBy === 'admin');

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentView('overview')} className="flex items-center text-slate-400 hover:text-slate-100 gap-2 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-600/30">
                    <CheckSquare size={16} /> Task Command Center
                </div>
            </div>

            {/* Alert Section */}
            {overdueTasks.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-red-500/20 rounded-full animate-pulse">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-100 mb-2">Deadline Alert!</h3>
                        <p className="text-red-300 mb-2">You have {overdueTasks.length} overdue tasks. Admin is watching!</p>
                        <p className="text-slate-200 italic font-medium bg-red-900/30 p-3 rounded-lg border border-red-500/30">
                            "{randomQuote}"
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Admin Assigned Tasks */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-400">
                        <ShieldCheck size={20} /> Admin Assigned Tasks
                    </h3>
                    <div className="space-y-3">
                        {adminTasks.length === 0 && <p className="text-slate-500 italic">No tasks assigned by Admin yet.</p>}
                        {adminTasks.map(task => (
                            <div key={task.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => toggleTask(task.id)} className={`mt-1 ${task.completed ? 'text-green-500' : 'text-slate-500'}`}>
                                            {task.completed ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>}
                                        </button>
                                        <div>
                                            <h4 className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</h4>
                                            {task.description && <p className="text-sm text-slate-400 mt-1">{task.description}</p>}
                                        </div>
                                    </div>
                                    {task.deadline && (
                                        <div className={`text-xs px-2 py-1 rounded border ${
                                            new Date(task.deadline).getTime() < Date.now() && !task.completed 
                                            ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                                            : 'bg-slate-750 text-slate-300 border-slate-600'
                                        }`}>
                                            {new Date(task.deadline).getTime() < Date.now() && !task.completed ? 'Overdue' : 'Due: ' + new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* All Tasks List (Editable) */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold mb-4 text-slate-100">Daily Task List</h3>
                    <div className="space-y-2">
                        {state.tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 rounded hover:bg-slate-750/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleTask(task.id)} className={task.completed ? 'text-green-500' : 'text-slate-500'}>
                                        {task.completed ? <CheckCircle size={18} /> : <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-600"></div>}
                                    </button>
                                    <span className={task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}>{task.title}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                    task.category === TaskCategory.STUDY ? 'border-blue-500/30 text-blue-400' :
                                    task.category === TaskCategory.SLEEP ? 'border-purple-500/30 text-purple-400' :
                                    'border-green-500/30 text-green-400'
                                }`}>{task.category}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // --- Sub-Component: Questions Detail ---
  const renderQuestionsView = () => {
    const handleUpdateQuestions = (subId: string, chapId: string, val: string) => {
        const num = parseInt(val) || 0;
        const updated = state.subjects.map(s => {
            if (s.id !== subId) return s;
            return {
                ...s,
                chapters: s.chapters.map(c => c.id === chapId ? { ...c, questionsSolved: num } : c)
            };
        });
        setSubjects(updated);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentView('overview')} className="flex items-center text-slate-400 hover:text-slate-100 gap-2 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-600/30">
                    <Book size={16} /> Question Bank Analytics
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold mb-6 text-slate-100">Chapter-wise Progress</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                <th className="p-3">Subject</th>
                                <th className="p-3">Chapter</th>
                                <th className="p-3 text-center">Solved</th>
                                <th className="p-3 text-center">Target</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-right">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {state.subjects.map(subject => (
                                <React.Fragment key={subject.id}>
                                    {subject.chapters.map(chapter => (
                                        <tr key={chapter.id} className="hover:bg-slate-750/50 transition-colors">
                                            <td className="p-3 font-medium text-blue-400">{subject.name}</td>
                                            <td className="p-3 text-slate-300">{chapter.name}</td>
                                            <td className="p-3 text-center font-bold text-xl text-slate-200">{chapter.questionsSolved}</td>
                                            <td className="p-3 text-center text-slate-500">200+</td>
                                            <td className="p-3 text-center">
                                                <div className="w-24 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${Math.min((chapter.questionsSolved / 200) * 100, 100)}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <input 
                                                    type="number" 
                                                    value={chapter.questionsSolved}
                                                    onChange={(e) => handleUpdateQuestions(subject.id, chapter.id, e.target.value)}
                                                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-slate-100 focus:ring-1 focus:ring-green-500 outline-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  // --- Sub-Component: Topics Detail ---
  const renderTopicsView = () => {
    const handleToggleTopic = (subId: string, chapId: string, current: number, total: number) => {
        // Logic to simulate checking off a topic (increment/decrement)
        // Since we store only count, we'll just increment up to total, or loop back to 0
        let newCovered = current + 1;
        if (newCovered > total) newCovered = 0;

        const updated = state.subjects.map(s => {
            if (s.id !== subId) return s;
            return {
                ...s,
                chapters: s.chapters.map(c => c.id === chapId ? { ...c, topicsCovered: newCovered } : c)
            };
        });
        setSubjects(updated);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentView('overview')} className="flex items-center text-slate-400 hover:text-slate-100 gap-2 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium border border-purple-600/30">
                    <Activity size={16} /> Topic Coverage Tracker
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.subjects.map(subject => (
                    <div key={subject.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-bold mb-4 text-blue-400">{subject.name}</h3>
                        <div className="space-y-6">
                            {subject.chapters.map(chapter => (
                                <div key={chapter.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-slate-200">{chapter.name}</span>
                                        <span className="text-xs text-slate-400">{chapter.topicsCovered}/{chapter.topicsTotal} Topics</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden cursor-pointer group relative" onClick={() => handleToggleTopic(subject.id, chapter.id, chapter.topicsCovered, chapter.topicsTotal)}>
                                        <div 
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300" 
                                            style={{ width: `${(chapter.topicsCovered / chapter.topicsTotal) * 100}%` }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                            <span className="text-[10px] text-white font-bold">Click to Update</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                       <button 
                                          onClick={() => handleToggleTopic(subject.id, chapter.id, chapter.topicsCovered, chapter.topicsTotal)}
                                          className="text-xs text-purple-400 hover:text-purple-300 underline"
                                       >
                                          {isAdmin ? "Admin: Update Progress" : "Mark Topic Complete"}
                                       </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  // --- Sub-Component: Hours Detail ---
  const renderHoursView = () => {
    // Hooks removed from here

    const logHours = () => {
        if (!manualHours) return;
        const hrs = parseFloat(manualHours);
        if (isNaN(hrs)) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title: manualDesc || 'Self Study Session',
            category: TaskCategory.STUDY,
            priority: 'Medium',
            completed: true,
            duration: hrs * 60, // store in minutes
            createdBy: 'user',
            startTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setTasks([...state.tasks, newTask]);
        setManualHours('');
        setManualDesc('');
    };

    // Mock data for the week chart
    const data = [
        { name: 'Mon', hours: 4 },
        { name: 'Tue', hours: 5.5 },
        { name: 'Wed', hours: 3 },
        { name: 'Thu', hours: 7 },
        { name: 'Fri', hours: 6 },
        { name: 'Sat', hours: 8.5 },
        { name: 'Sun', hours: studyHoursToday },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentView('overview')} className="flex items-center text-slate-400 hover:text-slate-100 gap-2 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2 bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium border border-orange-600/30">
                    <Clock size={16} /> Study Time Logger
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-6 text-slate-100">Weekly Study Hours</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                <Line type="monotone" dataKey="hours" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316'}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-orange-500/10 rounded-full">
                                <Timer size={32} className="text-orange-500" />
                             </div>
                             <div>
                                 <p className="text-slate-400 text-sm">Today's Total</p>
                                 <p className="text-3xl font-bold text-slate-100">{studyHoursToday.toFixed(1)} <span className="text-lg font-normal text-slate-500">hrs</span></p>
                             </div>
                        </div>
                        
                        <div className="space-y-4 pt-6 border-t border-slate-700">
                            <h4 className="font-semibold text-slate-200">Manual Log Entry</h4>
                            <input 
                                type="number" 
                                placeholder="Hours (e.g. 2.5)" 
                                value={manualHours}
                                onChange={(e) => setManualHours(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-100 focus:border-orange-500 outline-none"
                            />
                            <input 
                                type="text" 
                                placeholder="Description (Optional)" 
                                value={manualDesc}
                                onChange={(e) => setManualDesc(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-100 focus:border-orange-500 outline-none"
                            />
                            <button 
                                onClick={logHours}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Log Time
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
  };

  // --- Main Render Switch ---
  if (currentView === 'tasks') return renderTaskView();
  if (currentView === 'questions') return renderQuestionsView();
  if (currentView === 'topics') return renderTopicsView();
  if (currentView === 'hours') return renderHoursView();

  // --- Chart Data ---
  const pieData = [
    { name: 'Study', value: state.tasks.filter(t => t.category === TaskCategory.STUDY).length, color: '#3b82f6' },
    { name: 'Sleep', value: state.tasks.filter(t => t.category === TaskCategory.SLEEP).length, color: '#8b5cf6' },
    { name: 'Fun', value: state.tasks.filter(t => t.category === TaskCategory.FUN).length, color: '#10b981' },
    { name: 'Other', value: state.tasks.filter(t => t.category === TaskCategory.OTHER).length, color: '#64748b' },
  ].filter(d => d.value > 0);

  const subjectProgressData = state.subjects.map(sub => ({
    name: sub.name,
    completed: sub.chapters.filter(c => c.isCompleted).length,
    total: sub.chapters.length
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setCurrentView('tasks')} className="text-left bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center space-x-4 hover:border-blue-500 hover:bg-slate-750 transition-all group cursor-pointer">
          <div className="p-3 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
            <CheckCircle className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-blue-400 transition-colors">Daily Tasks</p>
            <p className="text-2xl font-bold text-slate-100">{progressPercentage}%</p>
          </div>
        </button>
        <button onClick={() => setCurrentView('questions')} className="text-left bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center space-x-4 hover:border-green-500 hover:bg-slate-750 transition-all group cursor-pointer">
          <div className="p-3 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
            <Book className="text-green-500" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-green-400 transition-colors">Questions Solved</p>
            <p className="text-2xl font-bold text-slate-100">{totalQuestions}</p>
          </div>
        </button>
        <button onClick={() => setCurrentView('topics')} className="text-left bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center space-x-4 hover:border-purple-500 hover:bg-slate-750 transition-all group cursor-pointer">
          <div className="p-3 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
            <Activity className="text-purple-500" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-purple-400 transition-colors">Topics Covered</p>
            <p className="text-2xl font-bold text-slate-100">{topicCompletion}%</p>
          </div>
        </button>
        <button onClick={() => setCurrentView('hours')} className="text-left bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center space-x-4 hover:border-orange-500 hover:bg-slate-750 transition-all group cursor-pointer">
          <div className="p-3 bg-orange-500/10 rounded-lg group-hover:scale-110 transition-transform">
            <Clock className="text-orange-500" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 group-hover:text-orange-400 transition-colors">Study Hours</p>
            <p className="text-2xl font-bold text-slate-100">{studyHoursToday.toFixed(1)}</p>
          </div>
        </button>
      </div>

      {/* Streak & Consistency Card */}
      <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 p-6 rounded-xl border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500/20 rounded-full animate-pulse-slow border border-orange-500/40">
            <Flame size={32} className="text-orange-500" />
            </div>
            <div>
            <h3 className="text-lg font-bold text-white">Interview Streak</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-400">{state.streak.currentStreak}</span>
                <span className="text-sm text-slate-400">days</span>
                <span className="text-xs text-slate-500 ml-2 bg-slate-800 px-2 py-0.5 rounded">Max: {state.streak.maxStreak}</span>
            </div>
            </div>
        </div>
        
        {/* Last 7 Days Visualizer */}
        <div className="flex gap-2">
            {last7Days.map(dateStr => {
                const isDone = state.streak.history?.includes(dateStr);
                const dateObj = new Date(dateStr);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                
                return (
                    <div key={dateStr} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                            isDone 
                            ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' 
                            : isToday 
                                ? 'bg-slate-800 border-slate-500 text-slate-400 border-dashed' 
                                : 'bg-slate-800 border-slate-700 text-slate-600'
                        }`}>
                            {isDone ? <Check size={14} strokeWidth={4} /> : dayName.charAt(0)}
                        </div>
                        <span className={`text-[10px] ${isToday ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>{dayName}</span>
                    </div>
                )
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-6 text-slate-100">Today's Activity Split</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
             {pieData.map(d => (
               <div key={d.name} className="flex items-center text-xs text-slate-400">
                 <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }}></div>
                 {d.name}
               </div>
             ))}
          </div>
        </div>

        {/* Subject Progress */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-6 text-slate-100">Chapter Completion by Subject</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{fill: '#334155', opacity: 0.4}}
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={40} />
                <Bar dataKey="total" name="Total Chapters" stackId="a" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
