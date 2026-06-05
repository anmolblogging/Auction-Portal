'use client';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { QUIZ_DATA } from '@/lib/quizData';

const overlayStyle: CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,7,14,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 };
const modalStyle: CSSProperties = { width: '100%', maxWidth: 540, background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--bd2)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease' };

export default function WorldCupQuiz({ category, onClose }: { category: string, onClose: () => void }) {
  const safeCategory = QUIZ_DATA[category] ? category : 'General World Cup';
  const questions = QUIZ_DATA[safeCategory];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedOpt(opt);
    setIsAnswered(true);
    if (opt === currentQ.a) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: 'center', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 2, color: 'var(--t1)', margin: 0 }}>
            {safeCategory} <span style={{ color: 'var(--g)' }}>COMPLETED</span>
          </h2>
          <div style={{ margin: '20px 0', position: 'relative', width: 140, height: 140, borderRadius: '50%', background: 'var(--bg2)', border: `8px solid ${percentage >= 70 ? 'var(--g)' : percentage >= 40 ? 'var(--am)' : 'var(--re)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'var(--t1)' }}>{score}/{questions.length}</span>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 16 }}>
            {percentage >= 80 ? "Incredible knowledge! You're a football historian." : percentage >= 50 ? "Solid effort! You know your stuff." : "Keep watching the beautiful game!"}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, width: '100%' }}>
            <button className="btn bs" onClick={onClose} style={{ flex: 1 }}>Close Quiz</button>
            <button className="btn bp" onClick={() => { setCurrentIndex(0); setScore(0); setSelectedOpt(null); setIsAnswered(false); setIsFinished(false); }} style={{ flex: 1 }}>Play Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd2)', paddingBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1.5, margin: 0 }}>{safeCategory}</h3>
            <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Rajdhani', sans-serif", marginTop: 4, fontWeight: 600 }}>Question {currentIndex + 1} of {questions.length}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ width: '100%', height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${((currentIndex) / questions.length) * 100}%`, height: '100%', background: 'var(--g)', transition: 'width 0.3s ease' }} />
        </div>

        <h4 style={{ fontSize: 18, color: 'var(--t1)', lineHeight: 1.5, margin: '10px 0' }}>{currentQ.q}</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {currentQ.opts.map((opt, i) => {
            let bg = 'var(--bg2)'; let borderColor = 'var(--bd2)'; let color = 'var(--t2)';
            if (isAnswered) {
              if (opt === currentQ.a) { bg = 'rgba(0,220,114,0.1)'; borderColor = 'var(--g)'; color = 'var(--g)'; } 
              else if (opt === selectedOpt) { bg = 'rgba(239,68,68,0.1)'; borderColor = 'var(--re)'; color = 'var(--re)'; }
            } else if (opt === selectedOpt) { bg = 'var(--bg3)'; }
            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={isAnswered} style={{ padding: '14px 18px', background: bg, border: `1px solid ${borderColor}`, borderRadius: 8, color: color, fontSize: 15, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", textAlign: 'left', cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.2s ease', outline: 'none' }}>
                {opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, minHeight: 44 }}>
          {isAnswered ? <span style={{ fontSize: 14, fontWeight: 'bold', color: selectedOpt === currentQ.a ? 'var(--g)' : 'var(--re)' }}>{selectedOpt === currentQ.a ? '✓ Correct!' : '✕ Incorrect'}</span> : <span />}
          <button className="btn bp" onClick={handleNext} disabled={!isAnswered} style={{ opacity: isAnswered ? 1 : 0, pointerEvents: isAnswered ? 'auto' : 'none' }}>
            {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      </div>
    </div>
  );
}