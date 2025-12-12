import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { Calendar as CalendarIcon, RefreshCw, CheckCircle, AlertCircle, LogIn, Plus, Trash2, Settings, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

// Type definitions for Google API globals
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface CalendarViewProps {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
}

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

const CalendarView: React.FC<CalendarViewProps> = ({ events, setEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Google Auth State
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  
  // Config State (API Key/Client ID)
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('GOOGLE_API_KEY') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('GOOGLE_CLIENT_ID') || '');

  // Add Event State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('class');

  useEffect(() => {
    // Only load if keys are present
    if (apiKey && clientId) {
      loadGapi();
    }
  }, [apiKey, clientId]);

  const loadGapi = () => {
    // Check if scripts are already loaded
    if (window.gapi) {
        initializeGapiClient();
    } else {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = initializeGapiClient;
        document.body.appendChild(gapiScript);
    }

    if (window.google?.accounts) {
        initializeGisClient();
    } else {
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = initializeGisClient;
        document.body.appendChild(gisScript);
    }
  };

  const initializeGapiClient = () => {
    window.gapi.load('client', async () => {
        try {
            await window.gapi.client.init({
                apiKey: apiKey,
            });

            // Explicitly load Calendar v3 to avoid discovery URL errors
            await window.gapi.client.load('calendar', 'v3');
            
            setGapiInited(true);
        } catch (err) {
            console.error('Error initializing GAPI', err);
            setSyncMessage('Error initializing Google API. Check API Key.');
            setSyncStatus('error');
        }
    });
  };

  const initializeGisClient = () => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error !== undefined) {
            throw resp;
          }
          setIsAuthenticated(true);
          setSyncMessage('Authenticated! Ready to sync.');
        },
      });
      setTokenClient(client);
      setGisInited(true);
    } catch (err) {
      console.error('Error initializing GIS', err);
      setSyncMessage('Error initializing Login. Check Client ID.');
      setSyncStatus('error');
    }
  };

  const handleAuthClick = () => {
    if (tokenClient === null) return;
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('GOOGLE_API_KEY', apiKey);
    localStorage.setItem('GOOGLE_CLIENT_ID', clientId);
    setShowConfig(false);
    window.location.reload(); // Simple reload to re-init scripts cleanly
  };

  const handleSync = async () => {
    if (!isAuthenticated) {
      setSyncStatus('error');
      setSyncMessage('Please sign in first.');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Syncing events...');

    let syncedCount = 0;
    let errors = 0;
    const newEvents = [...events];

    for (let i = 0; i < newEvents.length; i++) {
      const event = newEvents[i];
      if (!event.googleEventId) {
        try {
          const resource = {
            summary: event.title,
            description: 'Added via IIT Bombay Prep App',
            start: { date: event.date }, // All day event
            end: { date: event.date },
            colorId: event.type === 'exam' ? '11' : '10' // 11=Red, 10=Green (approx)
          };

          const response = await window.gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': resource,
          });

          newEvents[i] = { ...event, googleEventId: response.result.id };
          syncedCount++;
        } catch (err) {
          console.error('Error syncing event', event.title, err);
          errors++;
        }
      }
    }

    setEvents(newEvents);
    if (errors > 0) {
      setSyncStatus('error');
      setSyncMessage(`Synced ${syncedCount} events. ${errors} failed.`);
    } else if (syncedCount === 0) {
      setSyncStatus('success');
      setSyncMessage('All events are already synced.');
    } else {
      setSyncStatus('success');
      setSyncMessage(`Successfully synced ${syncedCount} events.`);
    }
  };

  const addLocalEvent = () => {
    if (!newEventTitle) return;
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      date: newEventDate,
      type: newEventType as any,
      color: newEventType === 'exam' ? '#ef4444' : newEventType === 'deadline' ? '#f59e0b' : '#3b82f6'
    };
    setEvents([...events, newEvent]);
    setNewEventTitle('');
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  // Calendar Grid Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Google Integration Header */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                   <CalendarIcon className="text-blue-500" /> Calendar & Sync
                </h2>
                <p className="text-sm text-slate-400 mt-1">Manage important dates and sync with your personal Google Calendar.</p>
             </div>
             
             <div className="flex items-center gap-3">
                 {!apiKey || !clientId ? (
                    <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg border border-yellow-600/50 hover:bg-yellow-600/30 transition-colors">
                        <Settings size={18} /> Configure API
                    </button>
                 ) : (
                    <>
                       {!isAuthenticated ? (
                          <button 
                             onClick={handleAuthClick} 
                             disabled={!gapiInited || !gisInited}
                             className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                          >
                             <LogIn size={18} /> Sign In to Google
                          </button>
                       ) : (
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                <CheckCircle size={16} /> Connected
                             </div>
                             <button 
                                onClick={handleSync}
                                disabled={syncStatus === 'syncing'}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                             >
                                <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                             </button>
                          </div>
                       )}
                       <button onClick={() => setShowConfig(true)} className="p-2 text-slate-400 hover:text-white"><Settings size={20} /></button>
                    </>
                 )}
             </div>
         </div>
         
         {/* Config Modal / Panel */}
         {showConfig && (
            <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
               <h3 className="font-bold mb-3 flex items-center gap-2"><Lock size={16}/> API Configuration</h3>
               <p className="text-xs text-slate-400 mb-4">
                 To enable syncing, you need a Google Cloud Project with the <strong>Google Calendar API</strong> enabled.
                 Enter your Client ID and API Key below. These are stored locally in your browser.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                    <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white" placeholder="AIza..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Client ID</label>
                    <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white" placeholder="...apps.googleusercontent.com" />
                  </div>
               </div>
               <div className="flex justify-end gap-2">
                  <button onClick={() => setShowConfig(false)} className="px-3 py-1 text-slate-400 hover:text-white">Cancel</button>
                  <button onClick={handleSaveConfig} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">Save & Reload</button>
               </div>
            </div>
         )}

         {/* Sync Status Message */}
         {syncMessage && (
             <div className={`mt-4 text-sm flex items-center gap-2 ${syncStatus === 'error' ? 'text-red-400' : syncStatus === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                {syncStatus === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                {syncMessage}
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Calendar Grid */}
         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold">
                 {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
               </h3>
               <div className="flex gap-2">
                 <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded"><ChevronLeft /></button>
                 <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded"><ChevronRight /></button>
               </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm text-slate-500 font-medium">
               <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
               {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-24 bg-transparent"></div>)}
               {days.map(day => {
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = events.filter(e => e.date === dateStr);
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <div key={day} className={`h-24 p-1 rounded-lg border flex flex-col gap-1 overflow-hidden transition-colors ${isToday ? 'bg-slate-700/50 border-blue-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                       <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{day}</span>
                       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                          {dayEvents.map(ev => (
                             <div key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded truncate text-white flex items-center gap-1" style={{ backgroundColor: ev.color }}>
                                {ev.googleEventId && <div className="w-1 h-1 rounded-full bg-white"></div>}
                                {ev.title}
                             </div>
                          ))}
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>

         {/* Event List & Add Form */}
         <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <h3 className="font-bold mb-4">Add Event</h3>
               <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Event Title"
                    value={newEventTitle}
                    onChange={e => setNewEventTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="date" 
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                  <select 
                     value={newEventType}
                     onChange={e => setNewEventType(e.target.value as any)}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                     <option value="exam">Exam</option>
                     <option value="deadline">Deadline</option>
                     <option value="class">Class</option>
                     <option value="other">Other</option>
                  </select>
                  <button onClick={addLocalEvent} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                     <Plus size={16} /> Add to Calendar
                  </button>
               </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <h3 className="font-bold mb-4">Upcoming Events</h3>
               <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {[...events].sort((a,b) => a.date.localeCompare(b.date)).map(ev => (
                     <div key={ev.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-700 group">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }}></div>
                           <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-slate-200">{ev.title}</p>
                              <p className="text-xs text-slate-500">{ev.date}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {ev.googleEventId && (
                                <span title="Synced to Google">
                                    <CheckCircle size={14} className="text-green-500" />
                                </span>
                            )}
                            <button onClick={() => deleteEvent(ev.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                            </button>
                        </div>
                     </div>
                  ))}
                  {events.length === 0 && <p className="text-xs text-slate-500 text-center">No upcoming events.</p>}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CalendarView;