import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  TrendingUp, 
  PieChart, 
  Settings,
  Menu,
  X,
  UserCircle,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
  Mic2,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Role, AppState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

// Google Drive Scopes
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILE_NAME = 'iit_bombay_prep_data.json';

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userRole, setUserRole, appState, setAppState }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Cloud Sync State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('GOOGLE_API_KEY') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('GOOGLE_CLIENT_ID') || '');
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Initialize theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && true); // Default to dark
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // --- Tracking Logic ---
  useEffect(() => {
    if (appState.trackingConsent !== 'granted') return;

    const updateActivity = () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        setAppState((prev) => {
            const log = prev.activityLog || [];
            const todayEntryIndex = log.findIndex(e => e.date === todayStr);
            
            let updatedLog = [...log];
            
            if (todayEntryIndex === -1) {
                // First activity of the day
                updatedLog.push({
                    date: todayStr,
                    firstActive: now.toISOString(),
                    lastActive: now.toISOString()
                });
            } else {
                // Update last active
                updatedLog[todayEntryIndex] = {
                    ...updatedLog[todayEntryIndex],
                    lastActive: now.toISOString()
                };
            }
            
            return { ...prev, activityLog: updatedLog };
        });
    };

    // Update on mount
    updateActivity();

    // Update periodically if tab is visible
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateActivity();
        }
    }, 60000); // Check every minute

    // Update on visibility change
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            updateActivity();
        }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [appState.trackingConsent]);

  const handleConsent = (granted: boolean) => {
      setAppState({ ...appState, trackingConsent: granted ? 'granted' : 'denied' });
  };


  // --- Google Drive Logic ---
  const initGoogleDrive = () => {
    if (!apiKey || !clientId) {
      setSyncStatus('error');
      setSyncMessage('Please configure API Key & Client ID first.');
      return;
    }

    const initializeGapiClient = () => {
      window.gapi.load('client', async () => {
        try {
            await window.gapi.client.init({
                apiKey: apiKey,
            });

            // Explicitly load Drive v3 to avoid discovery URL errors
            await window.gapi.client.load('drive', 'v3');

            // Initialize GIS after GAPI is loaded
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: DRIVE_SCOPES,
                callback: (resp: any) => {
                    if (resp.error !== undefined) {
                        throw resp;
                    }
                    setIsAuthenticated(true);
                    setSyncStatus('idle');
                    setSyncMessage('Connected to Google.');
                },
            });
            setTokenClient(client);
        } catch (err: any) {
            console.error(err);
            setSyncStatus('error');
            setSyncMessage('Failed to initialize Google API.');
        }
      });
    };

    if (window.gapi) {
        initializeGapiClient();
    } else {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = initializeGapiClient;
        document.body.appendChild(gapiScript);
    }
  };

  const handleAuth = () => {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: '' });
    } else {
        initGoogleDrive();
    }
  };

  const saveToDrive = async () => {
    if (!isAuthenticated) { setSyncMessage('Please sign in first.'); return; }
    setSyncStatus('loading');
    setSyncMessage('Saving backup...');

    try {
        // 1. Search for existing file
        const listResp = await window.gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const files = listResp.result.files;
        const fileContent = JSON.stringify(appState);
        const fileMetadata = {
            name: BACKUP_FILE_NAME,
            mimeType: 'application/json'
        };

        if (files && files.length > 0) {
            // Update existing file
            const fileId = files[0].id;
            await window.gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'media' },
                body: fileContent
            });
            setSyncMessage(`Backup updated: ${new Date().toLocaleTimeString()}`);
        } else {
            // Create new file
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const contentType = 'application/json';
            const metadata = {
                'name': BACKUP_FILE_NAME,
                'mimeType': contentType
            };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n\r\n' +
                fileContent +
                close_delim;

            await window.gapi.client.request({
                'path': '/upload/drive/v3/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });
            setSyncMessage('New backup created successfully!');
        }
        setSyncStatus('success');
    } catch (e: any) {
        console.error(e);
        setSyncStatus('error');
        setSyncMessage('Failed to save to Drive.');
    }
  };

  const loadFromDrive = async () => {
    if (!isAuthenticated) { setSyncMessage('Please sign in first.'); return; }
    setSyncStatus('loading');
    setSyncMessage('Searching for backup...');

    try {
        const listResp = await window.gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const files = listResp.result.files;
        if (files && files.length > 0) {
            const fileId = files[0].id;
            const response = await window.gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            
            const data = response.result; // gapi automatically parses JSON for 'media' alt if content-type is json
            // Validate data slightly
            if (data && data.tasks && data.subjects) {
                setAppState(data as AppState);
                setSyncStatus('success');
                setSyncMessage('Data restored successfully!');
                // Also update local storage for streak to stay in sync
                if (data.streak) {
                    localStorage.setItem('iit_streak', JSON.stringify(data.streak));
                }
            } else {
                throw new Error("Invalid file format");
            }
        } else {
            setSyncStatus('error');
            setSyncMessage('No backup file found.');
        }
    } catch (e: any) {
        console.error(e);
        setSyncStatus('error');
        setSyncMessage('Failed to load backup.');
    }
  };

  const handleSaveKeys = () => {
    localStorage.setItem('GOOGLE_API_KEY', apiKey);
    localStorage.setItem('GOOGLE_CLIENT_ID', clientId);
    initGoogleDrive();
  };


  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Daily Planner', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'study', label: 'Study Content', icon: BookOpen },
    { id: 'motivation', label: 'Motivation', icon: TrendingUp },
    { id: 'interview', label: 'IIT Interview', icon: Mic2 },
    { id: 'budget', label: 'Budget', icon: PieChart },
  ];

  if (userRole === 'admin') {
     menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Settings });
  }

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const initiateRoleSwitch = () => {
    if (userRole === 'admin') {
      setUserRole('student');
      if (activeTab === 'admin') setActiveTab('dashboard');
    } else {
      setShowAdminLogin(true);
      setError('');
      setPassword('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Prajwal@2102') { 
      setUserRole('admin');
      setShowAdminLogin(false);
      setPassword('');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden selection:bg-blue-500/30 transition-colors duration-300">
      {/* Consent Modal */}
      {appState.trackingConsent === 'pending' && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Eye size={32} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Enable Activity Tracking?</h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                    To help you build discipline, this app wants to track your <strong>Wake Up</strong> (First Activity) and <strong>Sleep</strong> (Last Activity) times. 
                    <br/><br/>
                    <span className="text-xs text-slate-500">This data is visible only to the Admin (Parent/Mentor) for behavioral analysis.</span>
                </p>
                <div className="flex gap-4">
                    <button onClick={() => handleConsent(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium text-slate-300 transition-colors">
                        Deny
                    </button>
                    <button onClick={() => handleConsent(true)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/30 transition-all active:scale-95">
                        Allow Tracking
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Cloud Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                   <Cloud className="text-blue-500" /> Cloud Backup
                </h3>
                <button onClick={() => setShowSyncModal(false)} className="p-1 text-slate-400 hover:text-white"><X size={20} /></button>
             </div>
             
             <div className="space-y-4">
                {/* Configuration Section */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-bold text-slate-300 mb-2">Google API Configuration</h4>
                    <div className="space-y-2">
                        <input type="text" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-xs text-white" />
                        <input type="text" placeholder="Client ID" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-xs text-white" />
                        <button onClick={handleSaveKeys} className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded">Save & Connect</button>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                   <button 
                      onClick={handleAuth}
                      disabled={isAuthenticated || !apiKey || !clientId}
                      className={`py-3 rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-all ${isAuthenticated ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                   >
                      {isAuthenticated ? <Check size={20} /> : <UserCircle size={20} />}
                      {isAuthenticated ? 'Connected' : 'Sign In'}
                   </button>

                   <div className="col-span-2 grid grid-cols-2 gap-3">
                       <button 
                          onClick={saveToDrive}
                          disabled={!isAuthenticated}
                          className="py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-all"
                       >
                          <Upload size={20} />
                          Save to Drive
                       </button>
                       <button 
                          onClick={loadFromDrive}
                          disabled={!isAuthenticated}
                          className="py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-all"
                       >
                          <Download size={20} />
                          Load from Drive
                       </button>
                   </div>
                </div>

                {/* Status */}
                {syncMessage && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                        syncStatus === 'error' ? 'bg-red-500/10 text-red-400' : 
                        syncStatus === 'success' ? 'bg-green-500/10 text-green-400' : 
                        'bg-blue-500/10 text-blue-400'
                    }`}>
                        {syncStatus === 'loading' && <RefreshCw className="animate-spin" size={16} />}
                        {syncStatus === 'error' && <AlertCircle size={16} />}
                        {syncStatus === 'success' && <Check size={16} />}
                        {syncMessage}
                    </div>
                )}
                
                <p className="text-[10px] text-slate-500 text-center">
                    Data is saved to a file named <code>{BACKUP_FILE_NAME}</code> in your Google Drive root folder.
                </p>
             </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                   <Lock className="text-blue-500" /> Admin Access
                </h3>
                <button 
                  onClick={() => setShowAdminLogin(false)} 
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                >
                   <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleLogin} className="space-y-4">
                <div>
                   <label className="block text-xs font-medium text-slate-400 mb-1">Enter Password</label>
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                     placeholder="••••••••"
                     autoFocus
                   />
                </div>
                
                {error && (
                  <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">
                    {error}
                  </div>
                )}

                <button 
                   type="submit"
                   className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                >
                   Verify & Access
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-slate-800 border-r border-slate-700/50 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-64 lg:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 lg:p-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl lg:rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="font-bold text-white text-lg lg:text-base">IIT</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">PREP</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center w-full px-4 py-3 lg:py-2.5 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-750 hover:text-slate-100 hover:translate-x-1'
              }`}
            >
              <item.icon size={20} className={`mr-3 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700/50 bg-slate-800/50 backdrop-blur">
          {/* Cloud Sync Button */}
          <button
            onClick={() => setShowSyncModal(true)}
            className="w-full mb-3 py-2 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/30 text-indigo-400 hover:text-indigo-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 group"
          >
             <Cloud size={16} /> Cloud Backup
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full mb-3 py-2 px-4 bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-3 group border border-slate-700"
          >
            {isDarkMode ? (
              <>
                <Sun size={18} className="text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={18} className="text-blue-400 group-hover:-rotate-12 transition-transform duration-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              {userRole === 'admin' ? <ShieldCheck size={16} className="text-green-400"/> : <UserCircle size={16} className="text-blue-400" />}
              <span className="capitalize font-medium">{userRole} Mode</span>
            </div>
          </div>
          <button
            onClick={initiateRoleSwitch}
            className="w-full py-2.5 px-4 bg-slate-750 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-600/50 hover:border-slate-500 flex items-center justify-center gap-2 group"
          >
            Switch Role
            <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 group-hover:text-white transition-colors">
                {userRole === 'student' ? 'Admin' : 'User'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xs">IIT</span>
            </div>
            <span className="font-bold text-lg text-slate-100">BOMBAY PREP</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg active:scale-95 transition-all">
            <Menu size={24} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth relative z-10">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;