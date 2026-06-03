'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

interface Question {
  q: string;
  options: string[];
  answer: number; // index into options
}

interface Quiz {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  questions: Question[];
}

// Hand-curated World Cup quizzes. Facts are limited to well-established ones
// (2026 hosting/format + historical records) to stay accurate.
const QUIZZES: Quiz[] = [
  {
    id: 'wc2026',
    title: 'World Cup 2026 Basics',
    emoji: '🌎',
    blurb: 'Hosts, format and venues of the 2026 tournament.',
    questions: [
      {
        q: 'Which three countries are co-hosting the 2026 World Cup?',
        options: ['USA, Canada & Mexico', 'USA, Mexico & Brazil', 'Canada, Mexico & Costa Rica', 'USA, Canada & Jamaica'],
        answer: 0,
      },
      {
        q: 'How many teams will compete at the 2026 World Cup?',
        options: ['32', '40', '48', '64'],
        answer: 2,
      },
      {
        q: 'How many matches will be played in total?',
        options: ['64', '80', '104', '128'],
        answer: 2,
      },
      {
        q: 'Which stadium hosts the 2026 final?',
        options: ['MetLife Stadium (New Jersey)', 'SoFi Stadium (Los Angeles)', 'Estadio Azteca (Mexico City)', 'AT&T Stadium (Dallas)'],
        answer: 0,
      },
      {
        q: 'Into how many groups are the 48 teams drawn?',
        options: ['8 groups of 6', '12 groups of 4', '16 groups of 3', '6 groups of 8'],
        answer: 1,
      },
    ],
  },
  {
    id: 'history',
    title: 'World Cup History',
    emoji: '📜',
    blurb: 'From 1930 to today — the tournament through the years.',
    questions: [
      {
        q: 'Which country hosted and won the first World Cup in 1930?',
        options: ['Brazil', 'Italy', 'Uruguay', 'Argentina'],
        answer: 2,
      },
      {
        q: 'Which nation has won the most World Cup titles?',
        options: ['Germany', 'Brazil', 'Italy', 'Argentina'],
        answer: 1,
      },
      {
        q: 'Who won the 2022 World Cup in Qatar?',
        options: ['France', 'Argentina', 'Croatia', 'Morocco'],
        answer: 1,
      },
      {
        q: 'Which country won the 2018 World Cup in Russia?',
        options: ['Croatia', 'Belgium', 'France', 'England'],
        answer: 2,
      },
      {
        q: 'The World Cup is normally held every how many years?',
        options: ['2', '3', '4', '5'],
        answer: 2,
      },
    ],
  },
  {
    id: 'legends',
    title: 'Legends & Records',
    emoji: '🏅',
    blurb: 'Iconic players and all-time records.',
    questions: [
      {
        q: 'Who is the all-time top scorer in World Cup history?',
        options: ['Ronaldo (Brazil)', 'Miroslav Klose', 'Lionel Messi', 'Pelé'],
        answer: 1,
      },
      {
        q: 'Which player won three World Cups (1958, 1962, 1970)?',
        options: ['Diego Maradona', 'Pelé', 'Franz Beckenbauer', 'Garrincha'],
        answer: 1,
      },
      {
        q: 'Who scored the famous "Hand of God" goal in 1986?',
        options: ['Diego Maradona', 'Lionel Messi', 'Gabriel Batistuta', 'Mario Kempes'],
        answer: 0,
      },
      {
        q: 'Which player has appeared in the most World Cup matches?',
        options: ['Paolo Maldini', 'Lothar Matthäus', 'Lionel Messi', 'Cristiano Ronaldo'],
        answer: 2,
      },
      {
        q: 'Kylian Mbappé scored a hat-trick in which World Cup final?',
        options: ['2014', '2018', '2022', '2010'],
        answer: 2,
      },
    ],
  },
];

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5,7,14,0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const modal: CSSProperties = {
  width: '100%',
  maxWidth: 560,
  maxHeight: '88vh',
  overflowY: 'auto',
  animation: 'fadeUp 0.3s ease',
  border: '1px solid var(--bd2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 24,
};

export default function WorldCupQuiz({ onClose }: { onClose: () => void }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function startQuiz(q: Quiz) {
    setQuiz(q);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  function backToMenu() {
    setQuiz(null);
    setDone(false);
  }

  function choose(i: number) {
    if (picked !== null) return; // lock after first pick
    setPicked(i);
    if (quiz && i === quiz.questions[index].answer) setScore((s) => s + 1);
  }

  function next() {
    if (!quiz) return;
    if (index + 1 >= quiz.questions.length) {
      setDone(true);
    } else {
      setIndex((n) => n + 1);
      setPicked(null);
    }
  }

  const header = (title: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>{title}</h3>
      <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
    </div>
  );

  // ── Quiz selection menu ──
  if (!quiz) {
    return (
      <div style={overlay} onClick={onClose}>
        <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
          {header('WORLD CUP 2026 QUIZ')}
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: -8 }}>Pick a quiz and test your World Cup knowledge.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {QUIZZES.map((q) => (
              <button
                key={q.id}
                className="card hover-lift"
                onClick={() => startQuiz(q)}
                style={{ textAlign: 'left', padding: 16, border: '1px solid var(--bd2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg2)' }}
              >
                <span style={{ fontSize: 28 }}>{q.emoji}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>{q.title}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{q.blurb}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--g)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{q.questions.length} Qs →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Result screen ──
  if (done) {
    const total = quiz.questions.length;
    const pct = Math.round((score / total) * 100);
    const verdict = pct === 100 ? 'Perfect! 🏆' : pct >= 60 ? 'Well played! ⚽' : 'Keep practising! 💪';
    return (
      <div style={overlay} onClick={onClose}>
        <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
          {header(quiz.title.toUpperCase())}
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: 'var(--g)', letterSpacing: 2, lineHeight: 1 }}>{score}/{total}</div>
            <div style={{ fontSize: 14, color: 'var(--t2)', marginTop: 8, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{verdict}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>You scored {pct}%</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn bs" onClick={() => startQuiz(quiz)} style={{ flex: 1, padding: 12 }}>↻ Retry</button>
            <button className="btn bp" onClick={backToMenu} style={{ flex: 1, padding: 12 }}>Other quizzes →</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question screen ──
  const question = quiz.questions[index];
  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        {header(quiz.title.toUpperCase())}

        {/* progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
            <span>QUESTION {index + 1} / {quiz.questions.length}</span>
            <span>SCORE {score}</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((index + (picked !== null ? 1 : 0)) / quiz.questions.length) * 100}%`, background: 'var(--g)', transition: 'width .3s ease' }} />
          </div>
        </div>

        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--t1)', lineHeight: 1.35 }}>{question.q}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options.map((opt, i) => {
            const isAnswer = i === question.answer;
            const isPicked = picked === i;
            let border = '1px solid var(--bd2)';
            let bg = 'var(--bg2)';
            let color = 'var(--t1)';
            if (picked !== null) {
              if (isAnswer) {
                border = '1px solid var(--g)';
                bg = 'rgba(0,220,114,0.12)';
                color = 'var(--g)';
              } else if (isPicked) {
                border = '1px solid var(--re)';
                bg = 'rgba(239,68,68,0.1)';
                color = 'var(--re)';
              }
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={picked !== null}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border,
                  background: bg,
                  color,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: picked !== null ? 'default' : 'pointer',
                  transition: 'all .15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{opt}</span>
                {picked !== null && isAnswer && <span>✓</span>}
                {picked !== null && isPicked && !isAnswer && <span>✕</span>}
              </button>
            );
          })}
        </div>

        <button
          className="btn bp"
          onClick={next}
          disabled={picked === null}
          style={{ width: '100%', padding: 12, opacity: picked === null ? 0.5 : 1 }}
        >
          {index + 1 >= quiz.questions.length ? 'See results →' : 'Next question →'}
        </button>
      </div>
    </div>
  );
}
