
import React, { useState } from 'react';
import { Subject, ChapterResource, ResourceType, PracticeTest } from '../types';
import { generateChapterFlashcards } from '../services/geminiService';
import { ChevronDown, ChevronRight, FileText, CheckCircle, Circle, BookOpen, ArrowRight, ArrowLeft, Video, Calculator, Link as LinkIcon, Plus, Trash2, X, Edit2, Check, ClipboardList, Award, MessageSquare, Search, ExternalLink, Sparkles, Zap, BrainCircuit, RotateCw, Layers } from 'lucide-react';

interface StudyTrackerProps {
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
  isAdmin: boolean;
}

const StudyTracker: React.FC<StudyTrackerProps> = ({ subjects, setSubjects, isAdmin }) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>('phy');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'syllabus' | 'tests'>('syllabus');
  const [searchQuery, setSearchQuery] = useState('');

  // Flashcard State
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Form State for adding resources
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResType, setNewResType] = useState<ResourceType>('note');
  const [newResUrl, setNewResUrl] = useState('');

  // Form State for editing resources
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editResTitle, setEditResTitle] = useState('');
  const [editResType, setEditResType] = useState<ResourceType>('note');
  const [editResUrl, setEditResUrl] = useState('');

  // Form State for adding Tests
  const [showAddTest, setShowAddTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestUrl, setNewTestUrl] = useState('');
  const [newTestDiff, setNewTestDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newTestTotal, setNewTestTotal] = useState(100);

  const activeSubject = subjects.find(s => s.id === selectedSubjectId || s.id === expandedSubject);
  const activeChapter = activeSubject?.chapters.find(c => c.id === selectedChapterId);

  // --- Search Logic ---
  const allResources = subjects.flatMap(sub => 
    sub.chapters.flatMap(chap => 
      (chap.resources || []).map(res => ({
        ...res,
        subjectName: sub.name,
        chapterName: chap.name,
        subjectId: sub.id,
        chapterId: chap.id
      }))
    )
  );

  const filteredResources = searchQuery 
    ? allResources.filter(res => 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        res.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // --- Chapter & Resource Handlers ---

  const toggleChapterCompletion = (subjectId: string, chapterId: string) => {
    const updated = subjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => 
          ch.id === chapterId ? { ...ch, isCompleted: !ch.isCompleted } : ch
        )
      };
    });
    setSubjects(updated);
  };

  const updateQuestions = (subjectId: string, chapterId: string, count: number) => {
    const updated = subjects.map(sub => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => 
          ch.id === chapterId ? { ...ch, questionsSolved: count } : ch
        )
      };
    });
    setSubjects(updated);
  };

  const openChapter = (subId: string, chapId: string) => {
    setSelectedSubjectId(subId);
    setSelectedChapterId(chapId);
    setExpandedSubject(subId);
    // Reset flashcard state
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const backToSyllabus = () => {
    setSelectedChapterId(null);
    setSelectedSubjectId(null);
    setShowAddResource(false);
    cancelEditingResource();
  };

  const addResource = () => {
    if (!activeSubject || !activeChapter || !newResTitle || !newResUrl) return;

    const newResource: ChapterResource = {
      id: Date.now().toString(),
      title: newResTitle,
      type: newResType,
      url: newResUrl
    };

    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => {
          if (ch.id !== activeChapter.id) return ch;
          return {
            ...ch,
            resources: [...(ch.resources || []), newResource]
          };
        })
      };
    });

    setSubjects(updated);
    setNewResTitle('');
    setNewResUrl('');
    setShowAddResource(false);
  };

  const deleteResource = (resId: string) => {
    if (!activeSubject || !activeChapter) return;
    
    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => {
          if (ch.id !== activeChapter.id) return ch;
          return {
            ...ch,
            resources: (ch.resources || []).filter(r => r.id !== resId)
          };
        })
      };
    });
    setSubjects(updated);
  };

  const startEditingResource = (res: ChapterResource) => {
    setEditingResourceId(res.id);
    setEditResTitle(res.title);
    setEditResType(res.type);
    setEditResUrl(res.url);
  };

  const cancelEditingResource = () => {
    setEditingResourceId(null);
    setEditResTitle('');
    setEditResUrl('');
  };

  const saveEditedResource = () => {
    if (!activeSubject || !activeChapter || !editingResourceId) return;

    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => {
          if (ch.id !== activeChapter.id) return ch;
          return {
            ...ch,
            resources: (ch.resources || []).map(r => 
              r.id === editingResourceId 
              ? { ...r, title: editResTitle, type: editResType, url: editResUrl }
              : r
            )
          };
        })
      };
    });
    setSubjects(updated);
    cancelEditingResource();
  };

  // --- Flashcard Logic ---
  const handleGenerateFlashcards = async () => {
    if (!activeSubject || !activeChapter) return;
    setLoadingFlashcards(true);
    const cards = await generateChapterFlashcards(activeSubject.name, activeChapter.name, activeChapter.grade);
    
    const updated = subjects.map(sub => {
        if (sub.id !== activeSubject.id) return sub;
        return {
            ...sub,
            chapters: sub.chapters.map(ch => 
                ch.id === activeChapter.id ? { ...ch, flashcards: cards } : ch
            )
        };
    });
    setSubjects(updated);
    setLoadingFlashcards(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (!activeChapter?.flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentCardIndex((prev) => (prev + 1) % activeChapter.flashcards!.length);
    }, 200);
  };

  const prevCard = () => {
    if (!activeChapter?.flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentCardIndex((prev) => (prev - 1 + activeChapter.flashcards!.length) % activeChapter.flashcards!.length);
    }, 200);
  };

  const getCardColor = (type: string) => {
     switch(type) {
         case 'formula': return { bg: 'bg-indigo-900/50', border: 'border-indigo-500/30', text: 'text-indigo-300' };
         case 'mnemonic': return { bg: 'bg-green-900/50', border: 'border-green-500/30', text: 'text-green-300' };
         case 'common_mistake': return { bg: 'bg-red-900/50', border: 'border-red-500/30', text: 'text-red-300' };
         default: return { bg: 'bg-blue-900/50', border: 'border-blue-500/30', text: 'text-blue-300' };
     }
  };

  // --- Practice Test Handlers ---

  const addPracticeTest = () => {
    if (!activeSubject || !newTestTitle || !newTestUrl) return;

    const newTest: PracticeTest = {
      id: Date.now().toString(),
      title: newTestTitle,
      url: newTestUrl,
      difficulty: newTestDiff,
      totalMarks: newTestTotal,
      score: undefined,
      feedback: undefined,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        practiceTests: [...(sub.practiceTests || []), newTest]
      };
    });

    setSubjects(updated);
    setNewTestTitle('');
    setNewTestUrl('');
    setNewTestDiff('Medium');
    setNewTestTotal(100);
    setShowAddTest(false);
  };

  const updateTestScore = (testId: string, score: number) => {
    if (!activeSubject) return;
    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        practiceTests: sub.practiceTests.map(t => 
          t.id === testId ? { ...t, score } : t
        )
      };
    });
    setSubjects(updated);
  };

  const updateTestFeedback = (testId: string, feedback: string) => {
    if (!activeSubject || !isAdmin) return;
    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        practiceTests: sub.practiceTests.map(t => 
          t.id === testId ? { ...t, feedback } : t
        )
      };
    });
    setSubjects(updated);
  };

  const deleteTest = (testId: string) => {
    if (!activeSubject || !isAdmin) return;
    const updated = subjects.map(sub => {
      if (sub.id !== activeSubject.id) return sub;
      return {
        ...sub,
        practiceTests: sub.practiceTests.filter(t => t.id !== testId)
      };
    });
    setSubjects(updated);
  };

  // --- Render Helpers ---

  const renderResourceItem = (res: ChapterResource, icon: React.ReactNode, themeColor: string, bgClass: string) => {
    if (editingResourceId === res.id) {
        return (
            <div key={res.id} className="p-4 bg-slate-900 border border-blue-500 rounded-lg space-y-3 shadow-xl animate-fade-in-up relative z-10">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Edit Resource</span>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                    <input 
                        type="text" 
                        value={editResTitle}
                        onChange={(e) => setEditResTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditedResource()}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Resource Title"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Resource URL</label>
                    <input 
                        type="text" 
                        value={editResUrl}
                        onChange={(e) => setEditResUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditedResource()}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="https://..."
                    />
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                        <select 
                            value={editResType}
                            onChange={(e) => setEditResType(e.target.value as ResourceType)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-blue-500"
                        >
                             <option value="note">Note</option>
                             <option value="formula">Formula</option>
                             <option value="video">Video</option>
                             <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2 flex-1">
                        <button 
                            onClick={saveEditedResource} 
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                            <Check size={14}/> Save
                        </button>
                        <button 
                            onClick={cancelEditingResource} 
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                            <X size={14}/> Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div key={res.id} className={`group flex items-center justify-between p-3 rounded-xl border border-slate-700/50 bg-slate-900/30 hover:bg-slate-800 hover:border-${themeColor.split('-')[1]}-500/30 transition-all duration-200`}>
            <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 min-w-0 group-hover:translate-x-1 transition-transform">
                <div className={`p-2.5 rounded-lg ${bgClass} ${themeColor} group-hover:scale-110 transition-transform`}>
                   {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors truncate pr-2`}>{res.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{res.type}</div>
                </div>
                <ExternalLink size={14} className={`text-slate-600 group-hover:${themeColor} opacity-0 group-hover:opacity-100 transition-all mr-2`} />
            </a>
            
            {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 border-l border-slate-700 pl-2">
                <button onClick={() => startEditingResource(res)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-all" title="Edit Resource">
                    <Edit2 size={14} />
                </button>
                <button onClick={() => deleteResource(res.id)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-all" title="Delete Resource">
                    <Trash2 size={14} />
                </button>
            </div>
            )}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search resources across all subjects by title or type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-10 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder-slate-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-100">
              <X size={18} />
            </button>
          )}
      </div>

      {searchQuery ? (
        // Search Results View
        <div className="animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-slate-200">Search Results ({filteredResources.length})</h2>
            {filteredResources.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
                    <p>No matches found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map(res => {
                         let Icon = FileText;
                         let colorClass = 'text-blue-400';
                         if (res.type === 'video') { Icon = Video; colorClass = 'text-red-400'; }
                         else if (res.type === 'formula') { Icon = Calculator; colorClass = 'text-purple-400'; }
                         else if (res.type === 'other') { Icon = LinkIcon; colorClass = 'text-slate-400'; }

                         return (
                            <div key={`${res.id}-${res.chapterId}`} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all group">
                                 <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                     <span>{res.subjectName}</span>
                                     <ChevronRight size={10} />
                                     <span>{res.chapterName}</span>
                                 </div>
                                 <a href={res.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 mb-3">
                                    <div className={`mt-0.5 ${colorClass}`}><Icon size={18} /></div>
                                    <div className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">{res.title}</div>
                                 </a>
                                 <div className="pt-3 border-t border-slate-700 flex justify-end">
                                     <button 
                                        onClick={() => { openChapter(res.subjectId, res.chapterId); setSearchQuery(''); }}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                     >
                                        Go to Chapter <ArrowRight size={12} />
                                     </button>
                                 </div>
                            </div>
                         );
                    })}
                </div>
            )}
        </div>
      ) : (selectedChapterId && activeChapter && activeSubject) ? (
        // Detailed Chapter View
        <div className="space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
             <button onClick={backToSyllabus} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft size={24} className="text-slate-300" />
             </button>
             <div>
                <div className="text-sm text-slate-400">{activeSubject.name} &bull; Class {activeChapter.grade}</div>
                <h1 className="text-2xl font-bold text-slate-100">{activeChapter.name}</h1>
             </div>
             <div className="ml-auto flex items-center gap-4">
                <div className="text-right hidden sm:block">
                   <div className="text-xs text-slate-400">Questions Solved</div>
                   <div className="font-bold text-xl text-slate-100">{activeChapter.questionsSolved}</div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${activeChapter.isCompleted ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-slate-750 text-slate-300 border-slate-600'}`}>
                  {activeChapter.isCompleted ? 'Completed' : 'In Progress'}
                </div>
             </div>
          </div>

          {/* AI Flashcards Section (NotebookLM Simulation) */}
          <div className="bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={120} />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  {/* Left: Controls & Info */}
                  <div className="md:w-1/3 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wider text-sm uppercase">
                          <BrainCircuit size={16} /> AI Research & Recall
                      </div>
                      <h2 className="text-2xl font-bold text-white leading-tight">
                          Topic-Wise Revision by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Gemini 2.5</span>
                      </h2>
                      <p className="text-slate-400 text-sm">
                          Deep-dive into every sub-topic. Generate concepts, formulas, and identify common mistakes instantly.
                      </p>
                      
                      {!activeChapter.flashcards || activeChapter.flashcards.length === 0 ? (
                         <button 
                             onClick={handleGenerateFlashcards}
                             disabled={loadingFlashcards}
                             className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                         >
                             {loadingFlashcards ? <RotateCw className="animate-spin" /> : <Zap fill="currentColor" />}
                             {loadingFlashcards ? 'Researching Topics...' : 'Generate Flashcards'}
                         </button>
                      ) : (
                          <div className="space-y-3">
                             <div className="flex gap-2">
                                <button onClick={prevCard} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 font-medium">Previous</button>
                                <button onClick={nextCard} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 font-medium">Next</button>
                             </div>
                             <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                <span>{activeChapter.flashcards.length} Cards Generated</span>
                                <span className="flex items-center gap-1"><Layers size={12}/> All Topics Covered</span>
                             </div>
                          </div>
                      )}
                  </div>

                  {/* Right: The 3D Card */}
                  <div className="md:w-2/3 w-full flex justify-center perspective-container h-64 md:h-80">
                      {loadingFlashcards ? (
                          <div className="w-full max-w-md h-full bg-slate-800/50 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center animate-pulse">
                              <Sparkles className="text-indigo-400 mb-4 animate-bounce" size={40} />
                              <p className="text-indigo-200 font-mono text-sm">Analyzing Syllabus & Topics...</p>
                          </div>
                      ) : activeChapter.flashcards && activeChapter.flashcards.length > 0 ? (
                          <div 
                             className="relative w-full max-w-md h-full cursor-pointer group/card"
                             onClick={() => setIsFlipped(!isFlipped)}
                             style={{ perspective: '1000px' }}
                          >
                              <div 
                                className="w-full h-full relative transition-all duration-700"
                                style={{ 
                                    transformStyle: 'preserve-3d', 
                                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                }}
                              >
                                  {/* Front */}
                                  <div 
                                    className="absolute inset-0 w-full h-full bg-slate-800 rounded-2xl border border-indigo-500/50 p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden"
                                    style={{ backfaceVisibility: 'hidden' }}
                                  >
                                      {activeChapter.flashcards[currentCardIndex].topic && (
                                        <div className="absolute top-4 left-4 px-2 py-1 rounded bg-slate-700/50 border border-slate-600/30 text-[10px] text-slate-300 font-mono">
                                            {activeChapter.flashcards[currentCardIndex].topic}
                                        </div>
                                      )}
                                      
                                      <div className={`absolute top-4 right-4 px-2 py-1 rounded border text-[10px] uppercase tracking-widest font-bold ${getCardColor(activeChapter.flashcards[currentCardIndex].type).bg} ${getCardColor(activeChapter.flashcards[currentCardIndex].type).border} ${getCardColor(activeChapter.flashcards[currentCardIndex].type).text}`}>
                                          {activeChapter.flashcards[currentCardIndex].type.replace('_', ' ')}
                                      </div>

                                      <div className="flex-1 flex items-center justify-center">
                                         <h3 className="text-xl md:text-2xl font-bold text-white leading-snug">
                                             {activeChapter.flashcards[currentCardIndex].front}
                                         </h3>
                                      </div>
                                      
                                      <div className="mt-auto w-full flex justify-between items-center text-xs text-slate-500">
                                          <span>Card {currentCardIndex + 1} / {activeChapter.flashcards.length}</span>
                                          <span className="text-indigo-400 animate-pulse">Click to flip</span>
                                      </div>
                                  </div>

                                  {/* Back */}
                                  <div 
                                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl border border-pink-500/50 p-8 flex flex-col items-center justify-center text-center shadow-2xl"
                                    style={{ 
                                        backfaceVisibility: 'hidden', 
                                        transform: 'rotateY(180deg)' 
                                    }}
                                  >
                                      <div className="absolute top-4 left-4 px-2 py-1 rounded bg-pink-900/50 border border-pink-500/30 text-[10px] text-pink-300 uppercase tracking-widest font-bold">
                                          Explanation
                                      </div>
                                      <div className="flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar">
                                         <p className="text-lg text-slate-100 font-medium leading-relaxed">
                                             {activeChapter.flashcards[currentCardIndex].back}
                                         </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="w-full max-w-md h-full bg-slate-900/50 rounded-2xl border border-slate-700 border-dashed flex items-center justify-center text-slate-500 text-center p-6">
                              <p>Click "Generate" to create comprehensive study cards.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Resource Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Section: Notes & PDF */}
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                   <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400"><FileText className="text-blue-500"/> Notes</h3>
                   <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{(activeChapter.resources || []).filter(r => r.type === 'note').length}</span>
                </div>
                <div className="space-y-3 flex-1">
                   {(activeChapter.resources || []).filter(r => r.type === 'note').length === 0 && <p className="text-slate-500 text-sm italic py-4 text-center bg-slate-900/30 rounded-lg">No notes uploaded.</p>}
                   {(activeChapter.resources || []).filter(r => r.type === 'note').map(res => 
                      renderResourceItem(res, <FileText size={18} className="flex-shrink-0" />, 'text-blue-400', 'bg-blue-500/10')
                   )}
                </div>
             </div>

             {/* Section: Formula Sheets */}
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                   <h3 className="font-bold text-lg flex items-center gap-2 text-purple-400"><Calculator className="text-purple-500"/> Formulas</h3>
                   <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{(activeChapter.resources || []).filter(r => r.type === 'formula').length}</span>
                </div>
                <div className="space-y-3 flex-1">
                   {(activeChapter.resources || []).filter(r => r.type === 'formula').length === 0 && <p className="text-slate-500 text-sm italic py-4 text-center bg-slate-900/30 rounded-lg">No formula sheets.</p>}
                   {(activeChapter.resources || []).filter(r => r.type === 'formula').map(res => 
                      renderResourceItem(res, <Calculator size={18} className="flex-shrink-0" />, 'text-purple-400', 'bg-purple-500/10')
                   )}
                </div>
             </div>

             {/* Section: Videos */}
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                   <h3 className="font-bold text-lg flex items-center gap-2 text-red-400"><Video className="text-red-500"/> Lectures</h3>
                   <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{(activeChapter.resources || []).filter(r => r.type === 'video').length}</span>
                </div>
                <div className="space-y-3 flex-1">
                   {(activeChapter.resources || []).filter(r => r.type === 'video').length === 0 && <p className="text-slate-500 text-sm italic py-4 text-center bg-slate-900/30 rounded-lg">No videos added.</p>}
                   {(activeChapter.resources || []).filter(r => r.type === 'video').map(res => 
                      renderResourceItem(res, <Video size={18} className="flex-shrink-0" />, 'text-red-400', 'bg-red-500/10')
                   )}
                </div>
             </div>
          </div>

          {/* Other Resources */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-300"><LinkIcon className="text-slate-400"/> Other Resources</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(activeChapter.resources || []).filter(r => r.type === 'other').length === 0 && <p className="text-slate-500 text-sm italic">No other resources.</p>}
                {(activeChapter.resources || []).filter(r => r.type === 'other').map(res => 
                   renderResourceItem(res, <LinkIcon size={18} className="flex-shrink-0" />, 'text-slate-300', 'bg-slate-500/10')
                )}
             </div>
          </div>

          {/* Admin Add Resource Panel */}
          {isAdmin && !editingResourceId && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 border-dashed border-blue-500/30">
               {!showAddResource ? (
                  <button 
                    onClick={() => setShowAddResource(true)}
                    className="w-full py-4 flex flex-col items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-slate-900/50 rounded-lg transition-all"
                  >
                     <Plus size={32} className="mb-2" />
                     <span className="font-medium">Add New Resource (Admin)</span>
                  </button>
               ) : (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-100">Add Resource</h3>
                        <button onClick={() => setShowAddResource(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                            <input 
                              type="text" 
                              placeholder="Resource Title"
                              value={newResTitle}
                              onChange={(e) => setNewResTitle(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                            <select 
                              value={newResType}
                              onChange={(e) => setNewResType(e.target.value as ResourceType)}
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                            >
                               <option value="note">Note</option>
                               <option value="formula">Formula</option>
                               <option value="video">Video</option>
                               <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">URL</label>
                            <input 
                              type="text" 
                              placeholder="https://..."
                              value={newResUrl}
                              onChange={(e) => setNewResUrl(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                     </div>
                     <button 
                       onClick={addResource}
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
                     >
                       Add Resource
                     </button>
                  </div>
               )}
            </div>
          )}
        </div>
      ) : (
        // Main Subject View (Syllabus or Tests)
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-up">
          <div className="lg:col-span-1 space-y-2">
            {subjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => { setExpandedSubject(sub.id); setViewMode('syllabus'); }}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between ${
                  expandedSubject === sub.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <span className="font-semibold">{sub.name}</span>
                {expandedSubject === sub.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ))}
            
            <div className="bg-slate-800/50 p-4 rounded-xl mt-6 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Overall Status</h4>
                <div className="flex items-center justify-between text-sm mb-1">
                    <span>Completed Chapters</span>
                    <span className="text-green-400 font-bold">
                        {subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.isCompleted).length, 0)} / 
                        {subjects.reduce((acc, s) => acc + s.chapters.length, 0)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span>Tests Taken</span>
                    <span className="text-purple-400 font-bold">
                         {subjects.reduce((acc, s) => acc + (s.practiceTests || []).filter(t => t.score !== undefined).length, 0)} / 
                         {subjects.reduce((acc, s) => acc + (s.practiceTests || []).length, 0)}
                    </span>
                </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {expandedSubject && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                        <BookOpen className="text-blue-500" />
                        {subjects.find(s => s.id === expandedSubject)?.name}
                      </h2>
                      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                          <button 
                            onClick={() => setViewMode('syllabus')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'syllabus' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                          >
                             Syllabus
                          </button>
                          <button 
                             onClick={() => setViewMode('tests')}
                             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tests' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                          >
                             Practice Tests
                          </button>
                      </div>
                   </div>
                </div>
                
                {/* View: Syllabus */}
                {viewMode === 'syllabus' && (
                  <div className="divide-y divide-slate-700 animate-fade-in-up">
                    {subjects.find(s => s.id === expandedSubject)?.chapters.map((chapter) => (
                      <div key={chapter.id} className="p-4 hover:bg-slate-750/50 transition-colors group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleChapterCompletion(expandedSubject, chapter.id); }}
                              className={`mt-0.5 ${chapter.isCompleted ? 'text-green-500' : 'text-slate-500 hover:text-slate-400'}`}
                            >
                               {chapter.isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => openChapter(expandedSubject, chapter.id)}>
                                  <h3 className={`font-semibold text-lg ${chapter.isCompleted ? 'text-slate-500' : 'text-slate-200'}`}>
                                      {chapter.name}
                                  </h3>
                                  <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400 border border-slate-600">{chapter.grade}</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  Topics: <span className="text-slate-300">{chapter.topicsCovered}/{chapter.topicsTotal}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                   Questions: <span className="text-slate-300">{chapter.questionsSolved}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                   Resources: <span className="text-slate-300">{(chapter.resources || []).length}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start">
                            <button 
                              onClick={() => openChapter(expandedSubject, chapter.id)}
                              className="px-4 py-2 bg-slate-700 hover:bg-blue-600 hover:text-white rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2"
                            >
                               View Content <ArrowRight size={16} />
                            </button>
                            
                                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
                                   <span className="text-xs text-slate-500 hidden xl:block">Solved:</span>
                                   <input 
                                     type="number" 
                                     value={chapter.questionsSolved}
                                     onChange={(e) => updateQuestions(expandedSubject, chapter.id, parseInt(e.target.value) || 0)}
                                     className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                                   />
                                </div>
                            
                          </div>
                        </div>
                        
                        <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                              className="bg-blue-500 h-full rounded-full" 
                              style={{ width: `${(chapter.topicsCovered / chapter.topicsTotal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* View: Practice Tests */}
                {viewMode === 'tests' && (
                  <div className="p-6 animate-fade-in-up">
                      {isAdmin && !showAddTest && (
                          <button 
                            onClick={() => setShowAddTest(true)}
                            className="w-full mb-6 py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-750 transition-all flex items-center justify-center gap-2"
                          >
                             <Plus size={20} /> Add New Practice Test
                          </button>
                      )}

                      {showAddTest && (
                          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                              <h3 className="font-bold text-white mb-3 flex items-center justify-between">
                                  New Test Details
                                  <button onClick={() => setShowAddTest(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <input 
                                    type="text" 
                                    placeholder="Test Title (e.g. Unit 1 Mock)" 
                                    value={newTestTitle}
                                    onChange={(e) => setNewTestTitle(e.target.value)}
                                    className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Test URL / Link" 
                                    value={newTestUrl}
                                    onChange={(e) => setNewTestUrl(e.target.value)}
                                    className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                  />
                                  <select 
                                    value={newTestDiff}
                                    onChange={(e) => setNewTestDiff(e.target.value as any)}
                                    className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                  >
                                      <option value="Easy">Easy</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Hard">Hard</option>
                                  </select>
                                  <input 
                                    type="number" 
                                    placeholder="Total Marks" 
                                    value={newTestTotal}
                                    onChange={(e) => setNewTestTotal(parseInt(e.target.value) || 0)}
                                    className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                  />
                              </div>
                              <button onClick={addPracticeTest} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">Create Test</button>
                          </div>
                      )}

                      <div className="space-y-4">
                          {subjects.find(s => s.id === expandedSubject)?.practiceTests?.length === 0 && <p className="text-slate-500 text-center italic">No practice tests assigned yet.</p>}
                          {subjects.find(s => s.id === expandedSubject)?.practiceTests?.map(test => (
                              <div key={test.id} className="bg-slate-750/30 p-5 rounded-lg border border-slate-700 flex flex-col md:flex-row gap-6">
                                  <div className="flex-1">
                                      <div className="flex items-start justify-between mb-2">
                                          <h3 className="font-bold text-lg text-slate-200">{test.title}</h3>
                                          {isAdmin && (
                                              <button onClick={() => deleteTest(test.id)} className="text-slate-500 hover:text-red-400 p-1">
                                                  <Trash2 size={16} />
                                              </button>
                                          )}
                                      </div>
                                      <div className="flex items-center gap-3 text-sm mb-4">
                                          <span className={`px-2 py-0.5 rounded border ${
                                              test.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                              test.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                              'bg-green-500/10 text-green-400 border-green-500/20'
                                          }`}>
                                              {test.difficulty}
                                          </span>
                                          <span className="text-slate-400">Total Marks: {test.totalMarks}</span>
                                          <span className="text-slate-500">&bull; {test.dateAdded}</span>
                                      </div>
                                      <a 
                                        href={test.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mb-4"
                                      >
                                          <ClipboardList size={16} /> Open Test Document
                                      </a>
                                      
                                      {/* Feedback Section */}
                                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                                              <MessageSquare size={12} /> FEEDBACK
                                          </div>
                                          {isAdmin ? (
                                              <textarea 
                                                value={test.feedback || ''}
                                                onChange={(e) => updateTestFeedback(test.id, e.target.value)}
                                                placeholder="Write feedback for the student..."
                                                className="w-full bg-transparent border-none text-sm text-slate-300 focus:ring-0 placeholder-slate-600 resize-none h-16"
                                              />
                                          ) : (
                                              <p className="text-sm text-slate-300">{test.feedback || 'No feedback provided yet.'}</p>
                                          )}
                                      </div>
                                  </div>

                                  {/* Score Section */}
                                  <div className="md:w-48 flex flex-col items-center justify-center bg-slate-800 rounded-lg p-4 border border-slate-700">
                                      <Award size={32} className={`mb-2 ${test.score ? 'text-yellow-400' : 'text-slate-600'}`} />
                                      <p className="text-xs text-slate-400 mb-2">SCORE OBTAINED</p>
                                      <div className="flex items-baseline gap-1">
                                          <input 
                                            type="number" 
                                            value={test.score || ''}
                                            onChange={(e) => updateTestScore(test.id, parseInt(e.target.value))}
                                            placeholder="-"
                                            className="w-16 bg-slate-900 border-b-2 border-slate-600 text-center text-2xl font-bold text-slate-100 focus:border-blue-500 focus:outline-none"
                                          />
                                          <span className="text-slate-500 text-lg">/ {test.totalMarks}</span>
                                      </div>
                                      {test.score !== undefined && (
                                          <div className="mt-2 text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                              {Math.round((test.score / test.totalMarks) * 100)}%
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTracker;
