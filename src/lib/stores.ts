import { writable, derived } from 'svelte/store';
import { db, type Question, type Exam, type Attempt, type User } from './db';
import { loadQuestions as fetchQuestions } from './questions';

// --- Base Stores ---
export const questions = writable<Question[]>([]);
export const user = writable<User | null>(null);
export const exams = writable<Exam[]>([]);
export const attempts = writable<Attempt[]>([]);
export const history = writable<HistoryEntry[]>([]);
export const loading = writable(true);

// --- Exam mode (in-progress exam) ---
export interface ExamMode {
  active: boolean;
  finished: boolean;
  current: number;
  total: number;
  timeLeft: number;
  answered: boolean[];
}

export const examMode = writable<ExamMode>({ active: false, finished: false, current: 0, total: 0, timeLeft: 30 * 60, answered: [] });
export const examExitRequested = writable(false);
export const examJumpTo = writable(0);

// --- Initialization ---
function normalizeUser(u: User): User {
  return {
    ...u,
    profilePic: u.profilePic ?? '',
    dailyGoal: u.dailyGoal ?? 0,
    dailyExamGoal: u.dailyExamGoal ?? 0
  };
}

export async function initApp() {
  loading.set(true);
  
  // Clean up any unfinished attempts from old logic
  await db.attempts.filter(a => !a.completed).delete();
  await refreshData();
  
  // 1. Load questions
  const qs = await fetchQuestions();
  questions.set(qs);
  
  // 2. Load User
  const u = await db.users.toCollection().first();
  if (u) user.set(normalizeUser(u));
  
  // 3. Load Data
  await refreshData();
  
  loading.set(false);
}

export async function refreshData() {
  const [u, allExams, allAttempts, allHistory] = await Promise.all([
    db.users.toCollection().first(),
    db.exams.orderBy('date').reverse().toArray(),
    db.attempts.orderBy('date').reverse().toArray(),
    db.history.toArray()
  ]);
  if (u) user.set(normalizeUser(u));
  exams.set(allExams);
  attempts.set(allAttempts);
  history.set(allHistory);
}

// --- Derived Stats ---
export const stats = derived([attempts, questions, history], ([$attempts, $questions, $history]) => {
  const finishedAttempts = $attempts.filter(a => a.completed);
  const totalExams = finishedAttempts.length;
  
  const avgScore = totalExams > 0 
    ? finishedAttempts.reduce((acc, a) => acc + a.score, 0) / totalExams 
    : 0;
    
  const passRate = totalExams > 0 
    ? (finishedAttempts.filter(a => a.score >= 27).length / totalExams) * 100 
    : 0;

  // Calculate Goals Today
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const ankiToday = $history.filter(h => h.type === 'anki' && new Date(h.date) >= today).length;
  const examsToday = finishedAttempts.filter(a => new Date(a.date) >= today).length;
  const totalAnki = $history.filter(h => h.type === 'anki').length;

  return {
    totalExams,
    avgScore,
    passRate,
    ankiToday,
    examsToday,
    totalAnki,
    recentAttempts: finishedAttempts.slice(0, 5)
  };
});

export const ankiStats = derived([questions], ([$questions]) => {
  // This will be expanded when we refactor Anki logic
  return {
    totalQuestions: $questions.length,
  };
});
