import React, { useState } from 'react';
import { Task, TaskCategory } from '../types';
import { prioritizeTasksWithAI } from '../services/geminiService';
import { Plus, Trash2, Check, Circle, Clock, Edit2, X, Timer, Zap, AlertTriangle, ArrowUp, Minus, ArrowDown, Sparkles } from 'lucide-react';

interface PlannerProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  isAdmin: boolean;
}

const Planner: React.FC<PlannerProps> = ({ tasks, setTasks, isAdmin }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>(TaskCategory.STUDY);
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('60');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const handleSaveTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const durationVal = parseInt(newTaskDuration) || 60;

    if (editingTaskId) {
      // Update existing task
      setTasks(tasks.map(t => t.id === editingTaskId ? {
        ...t,
        title: newTaskTitle,
        category: newTaskCategory,
        priority: newTaskPriority,
        startTime: newTaskTime || undefined,
        duration: durationVal
      } : t));
      setEditingTaskId(null);
    } else {
      // Add new task
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        category: newTaskCategory,
        priority: newTaskPriority,
        completed: false,
        startTime: newTaskTime || undefined,
        duration: durationVal
      };
      setTasks([...tasks, newTask]);
    }

    // Reset form
    setNewTaskTitle('');
    setNewTaskCategory(TaskCategory.STUDY);
    setNewTaskPriority('Medium');
    setNewTaskTime('');
    setNewTaskDuration('60');
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskCategory(task.category);
    setNewTaskPriority(task.priority);
    setNewTaskTime(task.startTime || '');
    setNewTaskDuration(task.duration ? task.duration.toString() : '60');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskCategory(TaskCategory.STUDY);
    setNewTaskPriority('Medium');
    setNewTaskTime('');
    setNewTaskDuration('60');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (editingTaskId === id) cancelEditing();
  };

  const handleAIPrioritize = async () => {
    if (tasks.length === 0) return;
    setIsPrioritizing(true);
    const rankedTasks = await prioritizeTasksWithAI(tasks);
    setTasks(rankedTasks);
    setIsPrioritizing(false);
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case TaskCategory.STUDY: return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case TaskCategory.SLEEP: return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case TaskCategory.FUN: return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-1.5 py-0.5 rounded"><ArrowUp size={10} /> High</span>;
      case 'Medium': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-1.5 py-0.5 rounded"><Minus size={10} /> Med</span>;
      case 'Low': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-400/10 border border-slate-400/30 px-1.5 py-0.5 rounded"><ArrowDown size={10} /> Low</span>;
      default: return null;
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getCategoryStyles = (cat: TaskCategory) => {
      switch (cat) {
          case TaskCategory.STUDY: return { bg: 'bg-blue-500', light: 'bg-blue-500/10', border: 'border-blue-500/30' };
          case TaskCategory.SLEEP: return { bg: 'bg-purple-500', light: 'bg-purple-500/10', border: 'border-purple-500/30' };
          case TaskCategory.FUN: return { bg: 'bg-green-500', light: 'bg-green-500/10', border: 'border-green-500/30' };
          default: return { bg: 'bg-slate-500', light: 'bg-slate-500/10', border: 'border-slate-500/30' };
      }
  };

  const calculateEndTime = (start: string, duration: number) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + duration;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const sortedTasks = tasks
      .filter(t => t.startTime)
      .sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
      {/* Task List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Today's Plan</h2>
              <span className="text-sm text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <button 
              onClick={handleAIPrioritize}
              disabled={isPrioritizing || tasks.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPrioritizing ? <Sparkles size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
              {isPrioritizing ? 'Sorting...' : 'AI Prioritize'}
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  task.completed ? 'bg-slate-800/50 border-slate-800 opacity-60' : 'bg-slate-750 border-slate-700 hover:border-slate-600'
                } ${editingTaskId === task.id ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`p-1 rounded-full transition-colors ${task.completed ? 'text-green-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {task.completed ? <Check size={20} /> : <Circle size={20} />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</h4>
                        {getPriorityBadge(task.priority)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                      <span className={`px-2 py-0.5 rounded-full border ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      {task.startTime && (
                        <span className="flex items-center text-slate-400">
                          <Clock size={12} className="mr-1" />
                          {task.startTime}
                        </span>
                      )}
                      {task.duration && (
                        <span className="flex items-center text-slate-400 border-l border-slate-700 pl-3">
                          <Timer size={12} className="mr-1" />
                          {task.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEditing(task)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No tasks for today. Time to relax or plan ahead!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Task Form & Visualizer */}
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-100">{editingTaskId ? 'Edit Activity' : 'Add Activity'}</h3>
             {editingTaskId && (
               <button onClick={cancelEditing} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                 <X size={14} /> Cancel
               </button>
             )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Solve HC Verma Ch 5"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select 
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.values(TaskCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                <select 
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Start Time (Opt)</label>
                <input 
                  type="time" 
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duration (min)</label>
                <input 
                  type="number" 
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  placeholder="60"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveTask}
              className={`w-full ${editingTaskId ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2`}
            >
              {editingTaskId ? <Check size={18} /> : <Plus size={18} />}
              {editingTaskId ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>

        {/* Timeline Visualizer */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-100">Day Visualizer</h3>
             <span className="text-xs text-slate-500 px-2 py-1 bg-slate-900 rounded">Proportional View</span>
           </div>
           
           <div className="relative ml-4 mt-2 pr-2">
             {/* Vertical Grid Line */}
             <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-700 rounded-full"></div>
             
             <div className="space-y-4 relative z-10">
               {sortedTasks.length === 0 && (
                   <div className="text-xs text-slate-500 italic pl-4 py-4">Add tasks with start times to visualize your day.</div>
               )}

               {sortedTasks.map((task, idx) => {
                 const styles = getCategoryStyles(task.category);
                 // Calculate visual height: e.g., 1.2px per minute
                 // Minimum height ensures visibility even for short tasks
                 const duration = task.duration || 60;
                 const visualHeight = Math.max(duration * 1.2, 50); 
                 
                 return (
                   <div key={idx} className="relative pl-6 group">
                     {/* Timeline Dot with Priority Color */}
                     <div className={`absolute -left-[5px] top-0 w-3 h-3 rounded-full border-2 border-slate-800 ${getPriorityDot(task.priority)} shadow-[0_0_8px_rgba(0,0,0,0.5)] z-20`}></div>
                     
                     {/* Connection Line / Bar */}
                     <div 
                        className={`absolute -left-[1px] top-3 w-0.5 opacity-60 ${styles.bg}`} 
                        style={{ height: `${visualHeight}px` }}
                     ></div>

                     {/* Task Block */}
                     <div 
                        className={`rounded-lg p-3 border transition-all hover:translate-x-1 ${styles.light} ${styles.border}`}
                        style={{ minHeight: `${visualHeight}px` }}
                     >
                        <div className="flex justify-between items-start">
                           <span className="font-bold text-sm text-slate-100 line-clamp-2">{task.title}</span>
                           <span className="text-[10px] font-mono text-slate-300 bg-slate-900/40 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                              {task.startTime}
                           </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Timer size={10} />
                                <span>{duration} min</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                                End: {calculateEndTime(task.startTime!, duration)}
                            </div>
                        </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Planner;