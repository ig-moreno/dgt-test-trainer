import Dexie, { type Table } from 'dexie';

// --- Interfaces ---
export interface User {
  id?: number;
  name: string;
  profilePic: string;
  dailyGoal: number;
  dailyExamGoal: number;
  lastGoalCelebration?: Date;
  registrationDate: Date;
}

export interface AnkiCard {
  id?: number;
  questionId: number;
  interval: number;
  repetition: number;
  easeFactor: number;
  dueDate: Date;
}

export interface Question {
  id: number;
  question: string;
  a: string;
  b: string;
  c: string;
  correct: number;
  explanation: string;
  img?: string;
  category?: string;
}

export interface Exam {
  id?: number;
  name: string;
  date: Date;
  difficulty: 'Indiferente' | 'Fácil' | 'Medio' | 'Difícil';
}

export interface Attempt {
  id?: number;
  examId: number;
  date: Date;
  score: number;
  total: number;
  completed: boolean;
  results: { questionId: number, selected: number }[];
}

export interface HistoryEntry {
  id?: number;
  date: Date;
  type: 'anki' | 'exam';
  referenceId: number; // Attempt ID or Question ID
  correct: boolean;
  quality?: number; // 0, 2, 3, 5
}

export class MyDatabase extends Dexie {
  users!: Table<User>;
  ankiCards!: Table<AnkiCard>;
  exams!: Table<Exam>;
  attempts!: Table<Attempt>;
  history!: Table<HistoryEntry>;

  constructor() {
    super('DgtTestDB');
    
    this.version(6).stores({
      users: '++id, name',
      ankiCards: '++id, questionId, dueDate',
      exams: '++id, name, date, difficulty',
      attempts: '++id, examId, date, score, completed',
      history: '++id, date, type, referenceId'
    });
  }
}

export const db = new MyDatabase();
