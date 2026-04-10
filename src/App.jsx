import React, { useState } from 'react';
import Home from './pages/Home';
import { DebugSimulation } from './pages/DebugSimulation';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  // Simple routing for debug
  if (isDebugMode && window.location.pathname === '/debug') {
    return <DebugSimulation onBack={() => {
        window.history.pushState({}, '', '/');
        setCurrentPage('home');
    }} />;
  }

  return <Home />;
}

export default App;