import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Dashboard from './pages/Dashboard';
import KnowledgeLab from './pages/KnowledgeLab';
import StudyArena from './pages/StudyArena';
import Commons from './pages/Commons';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="knowledge-lab" element={<KnowledgeLab />} />
          <Route path="study-arena" element={<StudyArena />} />
          <Route path="commons" element={<Commons />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
