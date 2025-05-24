// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyPage from './pages/CompanyPage';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar is always visible */}
        <Sidebar />

        {/* Main content area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            {/* Company view */}
            <Route
              path="/company/:companyName"
              element={<CompanyPage />}
            />

            {/* Default landing message */}
            <Route
              path="*"
              element={
                <div style={{ padding: '1rem' }}>
                  <h2>Welcome to LeetEase</h2>
                  <p>Select a company from the sidebar to get started.</p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
