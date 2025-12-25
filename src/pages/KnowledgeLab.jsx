import React, { useState } from 'react';
import { UploadCloud, FileText, Check, PenLine, Link as LinkIcon, Mic } from 'lucide-react';

const KnowledgeLab = () => {
  const [hasContent, setHasContent] = useState(true); // Simulating content state for "Zen Document" view

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '6rem' }}>

      {/* Header */}
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Knowledge Lab</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Review and verify your learning materials.</p>
      </header>

      {/* Input / Add Content Area - Minimalist */}
      <section style={{
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '4rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2rem',
        color: 'var(--text-secondary)',
        backgroundColor: 'rgba(0,0,0,0.01)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <UploadCloud size={18} />
          <span>Upload File</span>
        </div>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <LinkIcon size={18} />
          <span>Paste Link</span>
        </div>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-subtle)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Mic size={18} />
          <span>Record Note</span>
        </div>
      </section>

      {/* Zen Document View */}
      {hasContent && (
        <article style={{
          backgroundColor: 'var(--bg-card)',
          padding: '4rem 5rem',
          borderRadius: '2px', // Slight radius but mostly sharp like paper
          boxShadow: 'var(--shadow-soft)',
          minHeight: '800px',
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          lineHeight: '1.7',
          position: 'relative'
        }}>
          {/* Document Meta */}
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            New Summary • Generated 2m ago
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: '1.2' }}>
            The Neurobiology of Deep Learning and Memory Consolidation
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
            Based on recent publications by Dr. A. Sharma and colleagues (2023).
          </p>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem' }}>Introduction: The Synaptic Canvas</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>
            Deep learning, a subset of machine learning, draws significant inspiration from the structure and function of the human brain. This summary explores the intricate parallels between artificial neural networks and the biological processes underlying memory consolidation, specifically focusing on the role of synaptic plasticity and neural oscillations during sleep.
          </p>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem', backgroundColor: 'var(--accent-light)', padding: '0.2rem 0', display: 'inline' }}>
            We will delve into how these biological mechanisms inform the development of more efficient and robust artificial intelligence systems.
          </p>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem' }}>Key Concepts and Findings</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Long-Term Potentiation (LTP):</strong> The fundamental mechanism of synaptic strengthening, analogous to weight adjustments in artificial networks.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Hippocampal Sharp-Wave Ripples:</strong> Critical for replaying neuronal sequences during slow-wave sleep, facilitating memory transfer to the neocortex.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Catastrophic Forgetting:</strong> A challenge in AI where new learning overwrites old data, mitigated in biology by sleep-dependent consolidation.
            </li>
          </ul>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2.5rem', marginBottom: '1rem' }}>Implications for Future AI</h3>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>
            By understanding the biological basis of learning and memory, researchers aim to develop AI systems that are not only more capable but also more adaptable and energy-efficient. This neurobiologically inspired approach holds the promise of creating artificial intelligence that can learn continuously.
          </p>

        </article>
      )}

      {/* Floating Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%', // Centered relative to screen, need to account for sidebar offset if we want strict center
        marginLeft: '140px', // Offset for sidebar (280px / 2)
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--bg-card)',
        padding: '0.75rem 1rem',
        borderRadius: '50px',
        boxShadow: 'var(--shadow-hover)',
        display: 'flex',
        gap: '0.5rem',
        border: '1px solid var(--border-subtle)',
        zIndex: 50
      }}>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '50px',
          color: 'var(--text-primary)',
          fontWeight: 500,
          fontSize: '0.95rem',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'transparent'
        }}>
          <PenLine size={18} />
          Edit
        </button>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '50px',
          color: 'var(--accent-text)',
          backgroundColor: 'var(--accent-primary)',
          fontWeight: 600,
          fontSize: '0.95rem'
        }}>
          <Check size={18} strokeWidth={3} />
          Approve
        </button>
      </div>

    </div>
  );
};

export default KnowledgeLab;
