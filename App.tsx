
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import StudyTracker from './components/StudyTracker';
import Motivation from './components/Motivation';
import BudgetTracker from './components/BudgetTracker';
import AdminPanel from './components/AdminPanel';
import AITutor from './components/AITutor';
import CalendarView from './components/CalendarView';
import IITInterview from './components/IITInterview';
import { INITIAL_STATE } from './constants';
import { AppState, Role, Task, Subject, BudgetTransaction, CalendarEvent, VideoContent, DailyStreak } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  // Load streak from local storage on mount (fallback if not using Drive)
  useEffect(() => {
    const savedStreak = localStorage.getItem('iit_streak');
    if (savedStreak) {
        try {
            const parsed = JSON.parse(savedStreak);
            setState(prev => ({ ...prev, streak: parsed }));
        } catch (e) {
            console.error("Failed to load streak", e);
        }
    }
  }, []);

  // Helper to update tasks
  const updateTasks = (newTasks: Task[]) => {
    setState(prev => ({ ...prev, tasks: newTasks }));
  };

  // Helper to update subjects
  const updateSubjects = (newSubjects: Subject[]) => {
    setState(prev => ({ ...prev, subjects: newSubjects }));
  };

  // Helper to update budget
  const updateTransactions = (newTrans: BudgetTransaction[]) => {
    setState(prev => ({ ...prev, transactions: newTrans }));
  };

  // Helper to update events
  const updateEvents = (newEvents: CalendarEvent[]) => {
    setState(prev => ({ ...prev, events: newEvents }));
  };

  // Helper to update videos
  const updateVideos = (newVideos: VideoContent[]) => {
    setState(prev => ({ ...prev, motivationResources: newVideos }));
  };

  // Helper to update streak
  const updateStreak = (newStreak: DailyStreak) => {
    setState(prev => ({ ...prev, streak: newStreak }));
    localStorage.setItem('iit_streak', JSON.stringify(newStreak));
  };

  // Helper to update role
  const setUserRole = (role: Role) => {
    setState(prev => ({ ...prev, userRole: role }));
  };
  
  const isAdmin = state.userRole === 'admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard state={state} setTasks={updateTasks} setSubjects={updateSubjects} />;
      case 'planner':
        return <Planner tasks={state.tasks} setTasks={updateTasks} isAdmin={isAdmin} />;
      case 'study':
        return <StudyTracker subjects={state.subjects} setSubjects={updateSubjects} isAdmin={isAdmin} />;
      case 'motivation':
        return <Motivation videos={state.motivationResources || []} setVideos={updateVideos} isAdmin={isAdmin} />;
      case 'interview':
        return <IITInterview streak={state.streak} setStreak={updateStreak} />;
      case 'budget':
        return <BudgetTracker transactions={state.transactions} setTransactions={updateTransactions} />;
      case 'admin':
        return isAdmin ? <AdminPanel state={state} setSubjects={updateSubjects} /> : <div className="text-center p-10">Access Denied</div>;
      case 'calendar':
        return <CalendarView events={state.events} setEvents={updateEvents} />;
      default:
        return <Dashboard state={state} setTasks={updateTasks} setSubjects={updateSubjects} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userRole={state.userRole} 
      setUserRole={setUserRole}
      appState={state}
      setAppState={setState}
    >
       {renderContent()}
       <AITutor />
    </Layout>
  );
};

export default App;
