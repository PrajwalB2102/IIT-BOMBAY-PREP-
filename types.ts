
export type Role = 'student' | 'admin';

export enum TaskCategory {
  STUDY = 'Study',
  SLEEP = 'Sleep',
  FUN = 'Fun',
  OTHER = 'Other'
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  startTime?: string; // HH:mm
  duration?: number; // minutes
  deadline?: string; // ISO Date String
  createdBy?: 'admin' | 'user';
  description?: string;
}

export type ResourceType = 'note' | 'formula' | 'video' | 'other';

export interface ChapterResource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: 'concept' | 'formula' | 'mnemonic' | 'common_mistake';
  topic?: string;
}

export interface PracticeTest {
  id: string;
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalMarks: number;
  score?: number;
  feedback?: string;
  dateAdded: string;
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
  practiceTests: PracticeTest[];
}

export interface Chapter {
  id: string;
  name: string;
  grade: '11th' | '12th';
  topicsTotal: number;
  topicsCovered: number;
  questionsSolved: number;
  isCompleted: boolean;
  resources: ChapterResource[];
  flashcards?: Flashcard[];
}

export interface BudgetTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'class' | 'deadline' | 'other';
  color: string;
  googleEventId?: string;
}

export interface VideoContent {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  type: 'short' | 'long';
  isWatched: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- Interview & Analytics Types ---

export interface InterviewQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  concept: string;
  difficulty: 'Medium' | 'Hard' | 'Advanced';
}

export interface InterviewResult {
  questionId: string;
  userAnswer: string;
  score: number; // 0-10
  feedback: string; // The "Review"
  conceptExplanation: string;
  followUpProblem?: string; // Optional math problem if concept was weak
  applauseOrTaunt: string; // "चला कोणीतरी हुशार आहे भो"
}

export interface InterviewSessionAnalysis {
  conceptualUnderstanding: number; // 0-100
  applicationSkills: number; // 0-100
  formulaRetention: number; // 0-100
  strategicAdvice: string;
  weakTopics: string[];
}

export interface DailyStreak {
  currentStreak: number;
  lastInterviewDate: string | null; // ISO Date string
  maxStreak: number;
  history?: string[]; // Array of YYYY-MM-DD strings
}

export interface UserActivity {
  date: string; // YYYY-MM-DD
  firstActive: string; // ISO String (Wake up proxy)
  lastActive: string; // ISO String (Sleep proxy)
}

export interface AppState {
  userRole: Role;
  tasks: Task[];
  subjects: Subject[];
  transactions: BudgetTransaction[];
  events: CalendarEvent[];
  motivationResources: VideoContent[];
  streak: DailyStreak;
  trackingConsent: 'pending' | 'granted' | 'denied';
  activityLog: UserActivity[];
}
