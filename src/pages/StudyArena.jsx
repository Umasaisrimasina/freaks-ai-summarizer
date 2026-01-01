import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, RotateCcw, HelpCircle, Layers } from 'lucide-react';

const StudyArena = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); // Show quiz/flashcard modal
  const [mode, setMode] = useState('quiz'); // 'flashcard' or 'quiz'
  const [currentCard, setCurrentCard] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [shake, setShake] = useState(false);
  const [cardGlow, setCardGlow] = useState(null); // 'green', 'red', 'yellow', 'orange' or null
  const [flashcardRating, setFlashcardRating] = useState(null); // Track flashcard rating for border color

  const flashcards = [
    {
      question: 'What is the primary function of the mitochondria?',
      answer: 'Energy production (ATP)',
      description: 'Known as the powerhouse of the cell, it converts nutrients into adenosine triphosphate.',
      options: [
        'Energy production (ATP)',
        'Protein synthesis',
        'DNA replication',
        'Cell division'
      ],
      correctIndex: 0
    },
    {
      question: 'What is the capital of France?',
      answer: 'Paris',
      description: 'Located on the Seine River in northern France.',
      options: [
        'London',
        'Paris',
        'Berlin',
        'Madrid'
      ],
      correctIndex: 1
    },
    {
      question: 'What is the process by which green plants use sunlight to synthesize foods?',
      answer: 'Photosynthesis',
      description: 'It generally involves the green pigment chlorophyll and generates oxygen as a byproduct.',
      options: [
        'Respiration',
        'Fermentation',
        'Photosynthesis',
        'Transpiration'
      ],
      correctIndex: 2
    }
  ];

  const currentFlashcard = flashcards[currentCard];

  const handleRating = (rating) => {
    setFlashcardRating(rating); // Track rating for border color

    const glowMap = {
      bad: 'red',
      average: 'yellow',
      good: 'green',
      excellent: 'green'
    };
    setCardGlow(glowMap[rating]);

    setTimeout(() => {
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
        setIsRevealed(false);
        setCardGlow(null);
        setFlashcardRating(null); // Reset for next card
      } else {
        setSessionComplete(true);
      }
    }, 400);
  };

  const handleMCQSelect = (optionIndex) => {
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentFlashcard.correctIndex;

    // Automatic rating: Good for correct, Bad for wrong
    if (isCorrect) {
      setCardGlow('green');
    } else {
      setCardGlow('red');
    }

    // Auto-advance after showing feedback
    setTimeout(() => {
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
        setSelectedOption(null);
        setCardGlow(null);
      } else {
        setSessionComplete(true);
      }
    }, 800);
  };

  const handleRestart = () => {
    setCurrentCard(0);
    setIsRevealed(false);
    setSelectedOption(null);
    setShowHint(false);
    setIsSubmitted(false);
    setSessionComplete(false);
    setCardGlow(null);
    setFlashcardRating(null);
  };

  const handleStartMode = (selectedMode) => {
    setMode(selectedMode);
    setShowModal(true);
    handleRestart();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    handleRestart();
  };

  const ratingColors = {
    bad: { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444', text: '#DC2626' },
    average: { bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B', text: '#D97706' },
    good: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22C55E', text: '#16A34A' },
    excellent: { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366F1', text: '#4F46E5' }
  };

  // Mode Selection Screen
  if (!showModal) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '2rem',
          maxWidth: '900px',
          width: '100%'
        }}>
          {/* Quiz Mode Card */}
          <div
            onClick={() => handleStartMode('quiz')}
            style={{
              flex: 1,
              background: 'var(--mode-card-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              boxShadow: 'var(--mode-card-shadow)',
              border: '1px solid var(--mode-card-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--mode-card-shadow-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--mode-card-shadow)';
            }}
          >
            {/* Quiz Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'var(--mode-card-icon-bg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <HelpCircle size={40} color="var(--mode-card-text)" />
            </div>

            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--mode-card-text)',
              marginBottom: '0.75rem'
            }}>
              Quiz Mode
            </h2>

            <p style={{
              fontSize: '1rem',
              color: 'var(--mode-card-text-muted)',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Test yourself with multiple choice questions
            </p>

            <button style={{
              padding: '0.875rem 2rem',
              backgroundColor: 'var(--mode-card-btn-bg)',
              border: '2px solid var(--mode-card-btn-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--mode-card-text)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mode-card-btn-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--mode-card-btn-hover-border)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mode-card-btn-bg)';
                e.currentTarget.style.borderColor = 'var(--mode-card-btn-border)';
              }}
            >
              START QUIZ
            </button>
          </div>

          {/* Flashcard Mode Card */}
          <div
            onClick={() => handleStartMode('flashcard')}
            style={{
              flex: 1,
              background: 'var(--mode-card-bg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              boxShadow: 'var(--mode-card-shadow)',
              border: '1px solid var(--mode-card-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--mode-card-shadow-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--mode-card-shadow)';
            }}
          >
            {/* Flashcard Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'var(--mode-card-icon-bg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <Layers size={40} color="var(--mode-card-text)" />
            </div>

            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--mode-card-text)',
              marginBottom: '0.75rem'
            }}>
              Flashcard Mode
            </h2>

            <p style={{
              fontSize: '1rem',
              color: 'var(--mode-card-text-muted)',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Study with traditional flashcards
            </p>

            <button style={{
              padding: '0.875rem 2rem',
              backgroundColor: 'var(--mode-card-btn-bg)',
              border: '2px solid var(--mode-card-btn-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--mode-card-text)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mode-card-btn-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--mode-card-btn-hover-border)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mode-card-btn-bg)';
                e.currentTarget.style.borderColor = 'var(--mode-card-btn-border)';
              }}
            >
              START FLASHCARDS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal Content (Quiz/Flashcard)
  return (
    <>
      {/* Backdrop with Blur */}
      <div
        onClick={handleCloseModal}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        width: '90%',
        maxWidth: '700px',
        zIndex: 1001,
        boxShadow: mode === 'quiz'
          ? (selectedOption !== null && selectedOption === currentFlashcard.correctIndex
            ? '0 0 40px rgba(34, 197, 94, 0.4), 0 20px 60px rgba(0, 0, 0, 0.2)'
            : selectedOption !== null && selectedOption !== currentFlashcard.correctIndex
              ? '0 0 40px rgba(239, 68, 68, 0.4), 0 20px 60px rgba(0, 0, 0, 0.2)'
              : '0 20px 60px rgba(0, 0, 0, 0.3)')
          : mode === 'flashcard' && flashcardRating
            ? (flashcardRating === 'good' || flashcardRating === 'excellent'
              ? '0 0 40px rgba(34, 197, 94, 0.4), 0 20px 60px rgba(0, 0, 0, 0.2)'
              : flashcardRating === 'average'
                ? '0 0 40px rgba(245, 158, 11, 0.4), 0 20px 60px rgba(0, 0, 0, 0.2)'
                : '0 0 40px rgba(239, 68, 68, 0.4), 0 20px 60px rgba(0, 0, 0, 0.2)')
            : '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: mode === 'quiz'
          ? (selectedOption !== null && selectedOption === currentFlashcard.correctIndex
            ? '3px solid var(--success-500)'
            : selectedOption !== null && selectedOption !== currentFlashcard.correctIndex
              ? '3px solid var(--error-500)'
              : '1px solid var(--border-subtle)')
          : mode === 'flashcard' && flashcardRating
            ? (flashcardRating === 'good' || flashcardRating === 'excellent'
              ? '3px solid var(--success-500)'
              : flashcardRating === 'average'
                ? '3px solid var(--warning-500)'
                : '3px solid var(--error-500)')
            : '1px solid var(--border-subtle)',
        transition: 'box-shadow 0.3s ease, border 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>

          {/* Card Counter */}
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)'
          }}>
            {currentCard + 1} of {flashcards.length}
          </span>

          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        {!sessionComplete ? (
          <div style={{
            padding: '2rem',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {/* Question */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              {currentFlashcard.question}
            </h2>

            {/* Quiz Mode - MCQ Options */}
            {mode === 'quiz' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {currentFlashcard.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === currentFlashcard.correctIndex;
                  const showFeedback = selectedOption !== null;

                  let backgroundColor = 'var(--bg-secondary)';
                  let borderColor = 'transparent';
                  let textColor = 'var(--text-primary)';

                  if (showFeedback) {
                    if (isCorrect) {
                      backgroundColor = 'rgba(34, 197, 94, 0.1)';
                      borderColor = 'var(--success-500)';
                      textColor = 'var(--text-primary)';
                    } else if (isSelected && !isCorrect) {
                      backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      borderColor = 'var(--error-500)';
                      textColor = 'var(--text-primary)';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showFeedback && handleMCQSelect(index)}
                      disabled={showFeedback}
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor,
                        border: `2px solid ${borderColor}`,
                        borderRadius: 'var(--radius-md)',
                        color: textColor,
                        fontSize: '1rem',
                        textAlign: 'left',
                        cursor: showFeedback ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: isCorrect && showFeedback ? 600 : 400
                      }}
                    >
                      {option}
                    </button>
                  );
                })}

                {/* Description (shown after answer) */}
                {selectedOption !== null && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>💡</span>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      margin: 0,
                      lineHeight: 1.6
                    }}>
                      {currentFlashcard.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Flashcard Mode - Reveal Answer */}
            {mode === 'flashcard' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
              }}>
                {!isRevealed ? (
                  <button
                    onClick={() => setIsRevealed(true)}
                    style={{
                      padding: '0.875rem 2rem',
                      backgroundColor: 'var(--primary-600)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-700)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-600)'}
                  >
                    Reveal answer
                  </button>
                ) : (
                  <>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                      }}>
                        {currentFlashcard.answer}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)'
                      }}>
                        {currentFlashcard.description}
                      </p>
                    </div>

                    {/* Rating Buttons */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      width: '100%'
                    }}>
                      {['bad', 'average', 'good', 'excellent'].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRating(rating)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            border: `1px solid ${ratingColors[rating].border}`,
                            backgroundColor: ratingColors[rating].bg,
                            color: ratingColors[rating].text,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {rating === 'bad' && '😓 '}
                          {rating === 'average' && '😐 '}
                          {rating === 'good' && '😊 '}
                          {rating === 'excellent' && '🎉 '}
                          {rating.charAt(0).toUpperCase() + rating.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              Session Complete! 🎉
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              marginBottom: '2rem'
            }}>
              You've completed all {flashcards.length} cards
            </p>
            <button
              onClick={handleRestart}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: 'var(--primary-600)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RotateCcw size={18} />
              Restart Session
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StudyArena;
