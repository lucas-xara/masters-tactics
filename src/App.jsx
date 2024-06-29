import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Calendar from './components/Calendar';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/calendar" element={<Calendar />} />
    </Routes>
  );
};

export default App;
