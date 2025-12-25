import React, { useState } from 'react';
import { X, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudyArena = () => {
  const navigate = useNavigate();
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null); // null | 'correct' | 'incorrect'
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const cards = [
    { question: 'What is the capital of France?', answer: 'Paris' },
    { question: 'Who developed the theory of relativity?', answer: 'Albert Einstein' },
    { question: 'What is the powerhouse of the cell?', answer: 'Mitochondria' },
  ];

  const currentCard = cards[currentCardIndex];
  const isSessionComplete = currentCardIndex >= cards.length;

  const handleReveal = () => {
    setIsAnswerRevealed(true);
  };

  const handleAssessment = (assessment) => {
    // 'bad' -> incorrect, 'good'/'excellent' -> correct
    setFeedbackState(assessment === 'bad' ? 'incorrect' : 'correct');

    // Move to next card after a brief delay
    setTimeout(() => {
      setIsAnswerRevealed(false);
      setFeedbackState(null);
      setCurrentCardIndex((prev) => prev + 1);
    }, 800);
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setIsAnswerRevealed(false);
    setFeedbackState(null);
  };

  // Glow styles based on feedback
  const getCardGlow = () => {
    if (feedbackState === 'correct') return '0 0 40px 10px rgba(34, 197, 94, 0.3)';
    if (feedbackState === 'incorrect') return '0 0 40px 10px rgba(239, 68, 68, 0.3)';
    return 'var(--shadow-hover)';
  };

  const getCardBorder = () => {
    if (feedbackState === 'correct') return '2px solid rgba(34, 197, 94, 0.5)';
    if (feedbackState === 'incorrect') return '2px solid rgba(239, 68, 68, 0.5)';
    return '1px solid var(--border-subtle)';
  };

  // Session Complete Screen
  if (isSessionComplete) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Session Complete 🎉
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '400px' }}>
          Great job! You've reviewed all the cards in this session.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '50px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
          <button
            onClick={handleRestart}
            style={{
              padding: '1rem 2rem',
              borderRadius: '50px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCcw size={18} />
            Study Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      position: 'relative',
      padding: '2rem'
    }}>
      {/* Exit Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          padding: '0.5rem',
          borderRadius: '50%',
          color: 'var(--text-muted)',
          backgroundColor: 'transparent',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="Exit Session"
      >
        <X size={20} />
      </button>

      {/* Card Counter */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        {currentCardIndex + 1} / {cards.length}
      </div>

      {/* Floating Card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '4rem 5rem',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        boxShadow: getCardGlow(),
        border: getCardBorder(),
        transition: 'all 0.3s ease'
      }}>
        {/* Question */}
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: isAnswerRevealed ? '2rem' : '0',
          lineHeight: 1.4
        }}>
          {currentCard.question}
        </h2>

        {/* Answer (revealed) */}
        {isAnswerRevealed && (
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '2rem',
            marginTop: '1rem'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Answer
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {currentCard.answer}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {!isAnswerRevealed ? (
          <button
            onClick={handleReveal}
            style={{
              padding: '1rem 3rem',
              borderRadius: '50px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-soft)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Reveal Answer
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAssessment('bad')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#EF4444',
                fontWeight: 500,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Bad
            </button>
            <button
              onClick={() => handleAssessment('good')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Good
            </button>
            <button
              onClick={() => handleAssessment('excellent')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                color: '#22C55E',
                fontWeight: 500,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Excellent
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StudyArena;
