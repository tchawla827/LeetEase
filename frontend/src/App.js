// frontend/src/App.js
//npm start
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar     from './components/Sidebar';
import CompanyPage from './pages/CompanyPage';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Left pane: companies, scrollable in Sidebar */}
        <Sidebar />

        {/* Right pane: routes. CompanyPage will handle its own header/tabs + question scrolling */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
