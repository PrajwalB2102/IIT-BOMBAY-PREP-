
import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { AppState, Subject, Chapter, ChapterResource, ResourceType } from '../types';
import { Upload, FileText, Video, Calendar as CalendarIcon, CheckCircle, X, AlertCircle, UploadCloud, Layers, BookOpen, Trash2, Plus, GraduationCap, Layout, Eye, Clock, Sparkles } from 'lucide-react';
import { analyzeUserActivity } from '../services/geminiService';

interface AdminPanelProps {
  state: AppState;
  setSubjects: (subjects: Subject[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setSubjects }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'curriculum' | 'behavior'>('upload');
  
  // --- Upload Tab State ---
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Curriculum Tab State ---
  const [manageSubjectId, setManageSubjectId] = useState<string>(state.subjects[0]?.id || '');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterGrade, setNewChapterGrade] = useState<'11th' | '12th'>('11th');
  const [newChapterTopics, setNewChapterTopics] = useState(10);

  // --- Behavior Tab State ---
  const [behaviorReport, setBehaviorReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Effect to ensure manageSubjectId is valid if subjects change
  useEffect(() => {
    if (manageSubjectId && !state.subjects.find(s => s.id === manageSubjectId)) {
        setManageSubjectId(state.subjects[0]?.id || '');
    } else if (!manageSubjectId && state.subjects.length > 0) {
        setManageSubjectId(state.subjects[0].id);
    }
  }, [state.subjects, manageSubjectId]);

  const selectedSubject = state.subjects.find(s => s.id === selectedSubjectId);
  const selectedChapter = selectedSubject?.chapters.find(c => c.id === selectedChapterId);

  // --- Upload Handlers ---
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const addResourceToChapter = (title: string, type: ResourceType, url: string) => {
    if (!selectedSubject || !selectedChapter) return;

    const newResource: ChapterResource = {
      id: Date.now().toString(),
      title,
      type,
      url
    };

    const updatedSubjects = state.subjects.map(sub => {
      if (sub.id !== selectedSubject.id) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => {
          if (ch.id !== selectedChapter.id) return ch;
          return {
            ...ch,
            resources: [...(ch.resources || []), newResource]
          };
        })
      };
    });

    setSubjects(updatedSubjects);
    setUploadMessage({ type: 'success', text: `Successfully added "${title}" to ${selectedChapter.name}` });
    setTimeout(() => setUploadMessage(null), 3000);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!selectedSubjectId || !selectedChapterId) {
      setUploadMessage({ type: 'error', text: 'Please select a subject and chapter first.' });
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      const type: ResourceType = file.type.includes('pdf') ? 'note' : 'other';
      addResourceToChapter(file.name, type, url);
      return;
    }

    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText && (droppedText.startsWith('http') || droppedText.startsWith('www'))) {
      const type: ResourceType = (droppedText.includes('youtube') || droppedText.includes('youtu.be')) ? 'video' : 'other';
      addResourceToChapter('New Link Resource', type, droppedText);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!selectedSubjectId || !selectedChapterId) {
        setUploadMessage({ type: 'error', text: 'Please select a subject and chapter first.' });
        return;
      }
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type: ResourceType = file.type.includes('pdf') ? 'note' : 'other';
      addResourceToChapter(file.name, type, url);
    }
  };

  // --- Curriculum Handlers ---
  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const id = newSubjectName.toLowerCase().replace(/\s+/g, '-');
    const newSub: Subject = {
        id,
        name: newSubjectName,
        chapters: [],
        practiceTests: []
    };
    setSubjects([...state.subjects, newSub]);
    setNewSubjectName('');
    setManageSubjectId(id);
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Are you sure? This will delete all chapters and resources within this subject.')) {
        const remainingSubjects = state.subjects.filter(s => s.id !== id);
        setSubjects(remainingSubjects);
        // Effect hook handles resetting manageSubjectId
    }
  };

  const handleAddChapter = () => {
    if (!manageSubjectId || !newChapterName.trim()) return;
    const newChap: Chapter = {
        id: Date.now().toString(),
        name: newChapterName,
        grade: newChapterGrade,
        topicsTotal: newChapterTopics,
        topicsCovered: 0,
        questionsSolved: 0,
        isCompleted: false,
        resources: []
    };
    
    const updated = state.subjects.map(s => {
        if (s.id !== manageSubjectId) return s;
        return { ...s, chapters: [...s.chapters, newChap] };
    });
    setSubjects(updated);
    setNewChapterName('');
    setNewChapterTopics(10);
  };

  const handleDeleteChapter = (e: React.MouseEvent, subId: string, chapId: string) => {
    e.stopPropagation(); // Prevent any parent clicks
    if (window.confirm('Delete this chapter?')) {
        const updated = state.subjects.map(s => {
            if (s.id !== subId) return s;
            return { ...s, chapters: s.chapters.filter(c => c.id !== chapId) };
        });
        setSubjects(updated);
    }
  };

  // --- Behavior Handlers ---
  const handleGenerateReport = async () => {
      setLoadingReport(true);
      const res = await analyzeUserActivity(state.activityLog || []);
      setBehaviorReport(res.report);
      setLoadingReport(false);
  };

  // --- Renders ---
  
  const renderUploadTab = () => (
    <div className="animate-fade-in-up space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <UploadCloud className="text-blue-500" /> Upload Resources
        </h2>
        
        {/* Selection Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Subject</label>
            <select 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedSubjectId}
              onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedChapterId(''); }}
            >
              <option value="">-- Choose Subject --</option>
              {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Chapter</label>
            <select 
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              disabled={!selectedSubjectId}
            >
              <option value="">-- Choose Chapter --</option>
              {selectedSubject?.chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleFileInput}
            accept=".pdf,.doc,.docx"
          />
          
          <div className="bg-slate-800 p-4 rounded-full mb-4 shadow-lg">
            <UploadCloud size={40} className="text-blue-500" />
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Drag & Drop Files Here</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Drop your PDF notes, worksheets, or even drag a video link directly from your browser.
          </p>
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Upload size={18} />
            Browse Files
          </button>
        </div>

        {/* Status Message */}
        {uploadMessage && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            uploadMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
             {uploadMessage.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
             <span className="text-sm font-medium">{uploadMessage.text}</span>
          </div>
        )}
      </div>
      
      {/* Analytics Mini View */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
         <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                 <p className="text-slate-400 text-xs">Total Subjects</p>
                 <p className="text-2xl font-bold text-white">{state.subjects.length}</p>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                 <p className="text-slate-400 text-xs">Total Chapters</p>
                 <p className="text-2xl font-bold text-white">
                    {state.subjects.reduce((acc, s) => acc + s.chapters.length, 0)}
                 </p>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                 <p className="text-slate-400 text-xs">Resources Uploaded</p>
                 <p className="text-2xl font-bold text-blue-400">
                    {state.subjects.reduce((acc, s) => acc + s.chapters.reduce((cAcc, c) => cAcc + (c.resources?.length || 0), 0), 0)}
                 </p>
             </div>
         </div>
      </div>
    </div>
  );

  const renderCurriculumTab = () => {
    const activeManageSubject = state.subjects.find(s => s.id === manageSubjectId);
    
    return (
      <div className="animate-fade-in-up space-y-6">
         {/* Subject Manager */}
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="text-purple-500" /> Manage Curriculum
            </h2>
            
            <div className="flex flex-wrap gap-4 items-end border-b border-slate-700 pb-6 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Select Subject to Edit</label>
                    <div className="flex gap-2">
                        <select 
                            value={manageSubjectId}
                            onChange={(e) => setManageSubjectId(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                        >
                            <option value="" disabled>Select Subject</option>
                            {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button 
                            type="button"
                            onClick={() => handleDeleteSubject(manageSubjectId)}
                            disabled={!manageSubjectId}
                            className="px-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg border border-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Subject"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Or Create New Subject</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder="e.g. Mathematics"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-green-500 outline-none"
                        />
                        <button 
                            type="button"
                            onClick={handleAddSubject}
                            disabled={!newSubjectName.trim()}
                            className="px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Chapter Manager */}
            {activeManageSubject ? (
                <div>
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-lg text-slate-200">Chapters: {activeManageSubject.name}</h3>
                       <div className="text-xs text-slate-400 flex items-center gap-2">
                           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 11th Grade</span>
                           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> 12th Grade</span>
                       </div>
                   </div>

                   {/* Add Chapter Form */}
                   <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap gap-4 items-end">
                       <div className="flex-1 min-w-[200px]">
                           <label className="block text-xs text-slate-400 mb-1">New Chapter Name</label>
                           <input 
                               type="text" 
                               value={newChapterName}
                               onChange={(e) => setNewChapterName(e.target.value)}
                               placeholder="e.g. Complex Numbers"
                               className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                           />
                       </div>
                       <div className="w-[120px]">
                           <label className="block text-xs text-slate-400 mb-1">Grade</label>
                           <select 
                               value={newChapterGrade}
                               onChange={(e) => setNewChapterGrade(e.target.value as any)}
                               className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                           >
                               <option value="11th">11th</option>
                               <option value="12th">12th</option>
                           </select>
                       </div>
                       <div className="w-[100px]">
                           <label className="block text-xs text-slate-400 mb-1">Topics</label>
                           <input 
                               type="number" 
                               value={newChapterTopics}
                               onChange={(e) => setNewChapterTopics(parseInt(e.target.value))}
                               className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                           />
                       </div>
                       <button 
                           type="button"
                           onClick={handleAddChapter}
                           className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 h-[38px]"
                       >
                           <Plus size={16} /> Add Chapter
                       </button>
                   </div>

                   {/* Chapters Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* 11th Grade Column */}
                       <div className="bg-slate-900/30 rounded-xl border border-slate-700/50 flex flex-col">
                           <div className="p-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl flex items-center gap-2">
                               <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Class 11th</span>
                               <span className="text-slate-500 text-xs ml-auto">{activeManageSubject.chapters.filter(c => c.grade === '11th').length} Chapters</span>
                           </div>
                           <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                               {activeManageSubject.chapters.filter(c => c.grade === '11th').length === 0 && <p className="text-slate-500 text-sm text-center py-4">No chapters yet.</p>}
                               {activeManageSubject.chapters.filter(c => c.grade === '11th').map(chap => (
                                   <div key={chap.id} className="group flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 transition-colors">
                                       <div>
                                           <div className="font-medium text-sm text-slate-200">{chap.name}</div>
                                           <div className="text-xs text-slate-500">{chap.topicsTotal} Topics • {chap.questionsSolved} Qs</div>
                                       </div>
                                       <button 
                                          type="button"
                                          onClick={(e) => handleDeleteChapter(e, activeManageSubject.id, chap.id)} 
                                          className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all p-1.5"
                                          title="Delete Chapter"
                                       >
                                           <Trash2 size={16} />
                                       </button>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* 12th Grade Column */}
                       <div className="bg-slate-900/30 rounded-xl border border-slate-700/50 flex flex-col">
                           <div className="p-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl flex items-center gap-2">
                               <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Class 12th</span>
                               <span className="text-slate-500 text-xs ml-auto">{activeManageSubject.chapters.filter(c => c.grade === '12th').length} Chapters</span>
                           </div>
                           <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                               {activeManageSubject.chapters.filter(c => c.grade === '12th').length === 0 && <p className="text-slate-500 text-sm text-center py-4">No chapters yet.</p>}
                               {activeManageSubject.chapters.filter(c => c.grade === '12th').map(chap => (
                                   <div key={chap.id} className="group flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 transition-colors">
                                       <div>
                                           <div className="font-medium text-sm text-slate-200">{chap.name}</div>
                                           <div className="text-xs text-slate-500">{chap.topicsTotal} Topics • {chap.questionsSolved} Qs</div>
                                       </div>
                                       <button 
                                          type="button"
                                          onClick={(e) => handleDeleteChapter(e, activeManageSubject.id, chap.id)} 
                                          className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all p-1.5"
                                          title="Delete Chapter"
                                       >
                                           <Trash2 size={16} />
                                       </button>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
                    <Layers size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Select a subject above to manage its curriculum.</p>
                </div>
            )}
         </div>
      </div>
    );
  };

  const renderBehaviorTab = () => {
      const logs = state.activityLog || [];
      const reverseLogs = [...logs].reverse();

      return (
          <div className="animate-fade-in-up space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <div>
                          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                             <Eye size={24} /> Student Activity Tracking
                          </h2>
                          <p className="text-sm text-slate-400 mt-1">
                              Consent Status: <span className={`font-bold uppercase ${state.trackingConsent === 'granted' ? 'text-green-400' : 'text-red-400'}`}>{state.trackingConsent}</span>
                          </p>
                      </div>
                      <button 
                         onClick={handleGenerateReport}
                         disabled={loadingReport || logs.length === 0}
                         className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                         <Sparkles size={18} /> {loadingReport ? 'Analyzing...' : 'Generate Gemini Intelligence Report'}
                      </button>
                  </div>

                  {/* Gemini Report Section */}
                  {behaviorReport && (
                      <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-xl mb-6">
                          <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                              <Sparkles size={18} /> Behavioral Intelligence
                          </h3>
                          <div className="prose prose-invert max-w-none text-slate-300">
                              <p className="whitespace-pre-wrap leading-relaxed">{behaviorReport}</p>
                          </div>
                      </div>
                  )}

                  {/* Raw Data Table */}
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                                  <th className="p-4">Date</th>
                                  <th className="p-4">Wake Up (First Active)</th>
                                  <th className="p-4">Sleep (Last Active)</th>
                                  <th className="p-4">Active Duration</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                              {reverseLogs.length === 0 && (
                                  <tr><td colSpan={4} className="p-6 text-center text-slate-500 italic">No activity recorded yet.</td></tr>
                              )}
                              {reverseLogs.map((log, idx) => {
                                  const start = new Date(log.firstActive);
                                  const end = new Date(log.lastActive);
                                  const diffMs = end.getTime() - start.getTime();
                                  const hours = Math.floor(diffMs / 3600000);
                                  const mins = Math.round((diffMs % 3600000) / 60000);
                                  
                                  return (
                                      <tr key={idx} className="hover:bg-slate-750/30 transition-colors">
                                          <td className="p-4 font-mono text-slate-300">{log.date}</td>
                                          <td className="p-4 text-green-400 font-medium">
                                              <div className="flex items-center gap-2">
                                                  <Clock size={14} />
                                                  {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </div>
                                          </td>
                                          <td className="p-4 text-red-400 font-medium">
                                              <div className="flex items-center gap-2">
                                                  <Clock size={14} />
                                                  {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </div>
                                          </td>
                                          <td className="p-4 text-slate-400 text-sm">
                                              {hours}h {mins}m
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
       {/* Tab Navigation */}
       <div className="flex p-1 bg-slate-800 rounded-lg w-fit border border-slate-700 overflow-x-auto">
           <button 
             type="button"
             onClick={() => setActiveTab('upload')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
               <UploadCloud size={16} /> Upload Content
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab('curriculum')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'curriculum' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
               <Layers size={16} /> Manage Curriculum
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab('behavior')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'behavior' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
           >
               <Eye size={16} /> Student Behavior
           </button>
       </div>

       {activeTab === 'upload' && renderUploadTab()}
       {activeTab === 'curriculum' && renderCurriculumTab()}
       {activeTab === 'behavior' && renderBehaviorTab()}
    </div>
  );
};

export default AdminPanel;
