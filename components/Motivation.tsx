
import React, { useState, useEffect, useRef } from 'react';
import { Quote, PlayCircle, Plus, Trash2, X, Check, Youtube, Upload, CheckCircle } from 'lucide-react';
import { MOTIVATIONAL_QUOTES } from '../constants';
import { VideoContent } from '../types';

interface MotivationProps {
  videos: VideoContent[];
  setVideos: (videos: VideoContent[]) => void;
  isAdmin: boolean;
}

const Motivation: React.FC<MotivationProps> = ({ videos, setVideos, isAdmin }) => {
  const [activeVideo, setActiveVideo] = useState<VideoContent | null>(null);
  const [currentQuote, setCurrentQuote] = useState('');
  
  // Admin Form State
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoType, setNewVideoType] = useState<'long' | 'short'>('long');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [addError, setAddError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Quote Logic: No Repetition ---
  const getNewQuote = () => {
    const allIndices = Array.from({ length: MOTIVATIONAL_QUOTES.length }, (_, i) => i);
    // Get seen from local storage to persist across reloads
    let seenIndices: number[] = [];
    try {
        const stored = localStorage.getItem('seen_quotes');
        if (stored) seenIndices = JSON.parse(stored);
    } catch(e) { console.error(e); }

    // Filter available
    let available = allIndices.filter(i => !seenIndices.includes(i));

    // Reset cycle if all seen
    if (available.length === 0) {
        seenIndices = [];
        available = allIndices;
    }

    // Pick random from available
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    
    // Update seen list
    const newSeen = [...seenIndices, randomIndex];
    localStorage.setItem('seen_quotes', JSON.stringify(newSeen));
    
    setCurrentQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  };

  useEffect(() => {
    // Load initial quote on mount
    getNewQuote();
  }, []);

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    try {
        const trimmedUrl = url.trim();
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?\/]*).*/;
        const match = trimmedUrl.match(regExp);
        return (match && match[2] && match[2].length === 11) ? match[2] : null;
    } catch (e) {
        return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setNewVideoUrl(''); // Clear URL if file is selected
      setAddError('');
    }
  };

  const handleAddVideo = () => {
    setAddError('');
    if (!newVideoTitle.trim()) {
      setAddError('Please fill in title.');
      return;
    }

    let finalUrl = '';
    let finalThumbnail = '';

    if (uploadFile) {
      finalUrl = URL.createObjectURL(uploadFile);
      finalThumbnail = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop';
    } else if (newVideoUrl.trim()) {
      const trimmedUrl = newVideoUrl.trim();
      const videoId = extractYoutubeId(trimmedUrl);
      if (!videoId) {
        setAddError('Invalid YouTube URL. Please use a valid link (Video or Short).');
        return;
      }
      finalUrl = trimmedUrl;
      finalThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      setAddError('Please provide a YouTube URL or upload a video file.');
      return;
    }

    const newVideo: VideoContent = {
      id: Date.now().toString(),
      title: newVideoTitle,
      url: finalUrl,
      thumbnail: finalThumbnail,
      type: newVideoType,
      isWatched: false
    };

    setVideos([...videos, newVideo]);
    
    // Reset form
    setNewVideoTitle('');
    setNewVideoUrl('');
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteVideo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this video permanently?')) {
      const updatedVideos = videos.filter(v => v.id !== id);
      setVideos(updatedVideos);
      if (activeVideo?.id === id) setActiveVideo(null);
    }
  };

  const markAsWatched = (id: string) => {
    setVideos(videos.map(v => v.id === id ? { ...v, isWatched: true } : v));
    if (activeVideo?.id === id) setActiveVideo(null);
  };

  const openPlayer = (video: VideoContent) => {
    setActiveVideo(video);
  };

  const visibleVideos = isAdmin ? videos : videos.filter(v => !v.isWatched);
  const longVideos = visibleVideos.filter(v => v.type === 'long');
  const shortVideos = visibleVideos.filter(v => v.type === 'short');
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';
  const youtubeId = activeVideo ? extractYoutubeId(activeVideo.url) : null;

  return (
    <div className="space-y-8 relative animate-fade-in-up">
      {/* Modal Player (Only for Shorts or Uploaded Videos) */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
               <h3 className="font-bold text-white truncate pr-4">{activeVideo.title}</h3>
               <button onClick={() => setActiveVideo(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors">
                  <X size={24} />
               </button>
            </div>
            
            <div className={`relative w-full bg-black ${activeVideo.type === 'short' ? 'aspect-[9/16] h-[60vh] mx-auto w-auto' : 'aspect-video'}`}>
               {youtubeId ? (
                 <iframe 
                   src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`} 
                   title={activeVideo.title}
                   className="absolute inset-0 w-full h-full"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                   allowFullScreen
                 ></iframe>
               ) : (
                 <video 
                   src={activeVideo.url} 
                   controls 
                   autoPlay 
                   className="absolute inset-0 w-full h-full bg-black"
                   onEnded={() => !isAdmin && markAsWatched(activeVideo.id)}
                 >
                   Your browser does not support the video tag.
                 </video>
               )}
            </div>

            <div className="p-4 bg-slate-800 flex justify-center gap-4">
               {!isAdmin && (
                 <button 
                   onClick={() => markAsWatched(activeVideo.id)}
                   className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-green-600 text-slate-200 hover:text-white font-medium rounded-xl transition-all active:scale-95"
                 >
                   <Check size={20} />
                   Mark as Watched
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Quote of the Day Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 lg:p-12 text-center shadow-xl overflow-hidden group">
        <div className="absolute top-0 left-0 p-4 opacity-10">
          <Quote size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6 leading-tight min-h-[80px] flex items-center justify-center">
            "{currentQuote}"
          </h2>
          <p className="text-blue-100 font-medium tracking-wide opacity-80">- आता अभ्यास कर चल by (प्रज्वल बेंद्रे)</p>
        </div>
      </div>

      {/* Admin Add Video Section */}
      {isAdmin && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 border-dashed border-blue-500/30">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400">
             <Plus size={20} /> Add New Video Resource
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                placeholder="Video Title"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
              
              <div className="md:col-span-2 flex gap-2">
                 {/* URL Input */}
                 <input 
                   type="text" 
                   placeholder={uploadFile ? `File: ${uploadFile.name}` : "YouTube URL"}
                   value={newVideoUrl}
                   onChange={(e) => { setNewVideoUrl(e.target.value); setUploadFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                   disabled={!!uploadFile}
                   className={`flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 ${uploadFile ? 'opacity-50' : ''}`}
                 />
                 
                 {/* File Upload Button */}
                 <div className="relative">
                   <input 
                     type="file" 
                     ref={fileInputRef}
                     onChange={handleFileSelect}
                     className="hidden"
                     accept="video/*"
                   />
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className={`h-full px-4 rounded-lg border border-slate-600 flex items-center justify-center transition-colors ${uploadFile ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                     title="Upload Video File"
                   >
                     {uploadFile ? <Check size={20} /> : <Upload size={20} />}
                   </button>
                   {uploadFile && (
                     <button 
                       onClick={() => { setUploadFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                       className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                     >
                       <X size={12} />
                     </button>
                   )}
                 </div>
              </div>

              <div className="flex gap-2">
                <select 
                  value={newVideoType}
                  onChange={(e) => setNewVideoType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="long">Video</option>
                  <option value="short">Short</option>
                </select>
                <button 
                  onClick={handleAddVideo}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg flex-1 font-medium transition-colors"
                >
                  Add
                </button>
              </div>
           </div>
           {addError && <p className="text-red-400 text-sm mt-2">{addError}</p>}
        </div>
      )}

      {/* Shorts Section (Horizontal Scroll) */}
      <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Youtube className="text-red-500" /> Motivational Shorts
          </h3>
          {shortVideos.length === 0 ? (
            <p className="text-slate-500 italic">No shorts available. Time to study!</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {shortVideos.map((video) => (
                    <div 
                      key={video.id} 
                      onClick={() => openPlayer(video)}
                      className="min-w-[150px] w-[150px] h-[260px] bg-slate-800 rounded-xl border border-slate-700 flex-shrink-0 relative overflow-hidden group cursor-pointer hover:border-blue-500 transition-all"
                    >
                        <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                           <PlayCircle size={40} className="text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                            <p className="text-xs font-bold text-white line-clamp-2">{video.title}</p>
                        </div>
                        {isAdmin && (
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteVideo(video.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Delete Short"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                    </div>
                ))}
            </div>
          )}
      </div>

      {/* Inline Long Video Feed */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PlayCircle className="text-blue-500" />
            Curated For You
          </h3>
        </div>

        {longVideos.length === 0 ? (
           <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
             <p className="text-slate-400">All videos watched! Great job.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {longVideos.map((video) => {
               const ytId = extractYoutubeId(video.url);
               
               return (
                <div key={video.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all group flex flex-col">
                  {/* Inline Video Player */}
                  <div className="relative aspect-video bg-black">
                     {ytId ? (
                         <iframe
                           src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${origin}`}
                           className="absolute inset-0 w-full h-full"
                           title={video.title}
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                           allowFullScreen
                         />
                     ) : (
                         <video 
                           src={video.url} 
                           controls 
                           className="absolute inset-0 w-full h-full bg-black"
                         />
                     )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-semibold text-lg line-clamp-2 mb-4 group-hover:text-blue-400 transition-colors">
                        {video.title}
                    </h4>
                    
                    <div className="mt-auto flex items-center justify-between gap-2">
                       {/* Mark as Watched Button for Students */}
                       {!isAdmin && (
                           <button 
                             onClick={() => markAsWatched(video.id)}
                             className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 active:scale-95"
                           >
                              <CheckCircle size={16} /> Mark Watched
                           </button>
                       )}

                       {/* Admin Delete Button */}
                       {isAdmin && (
                          <button 
                            onClick={() => deleteVideo(video.id)}
                            className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-sm rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                       )}
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Motivation;
