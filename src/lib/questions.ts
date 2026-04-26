import type { Question } from './db';

export async function loadQuestions(): Promise<Question[]> {
  const response = await fetch('./data.json');
  const data = await response.json();
  return data.map((q: any, index: number) => ({
    id: index,
    img: q.img,
    question: q.question,
    a: q['a.'],
    b: q['b.'],
    c: q['c.'],
    explanation: q.explanation,
    correct: q.correct.split(' ').indexOf('1')
  }));
}
