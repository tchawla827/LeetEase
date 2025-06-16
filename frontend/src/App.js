// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorToastProvider } from './context/ErrorToastContext';
import './App.css'; // Ensure this import remains

import Navbar            from './components/Navbar';
import Sidebar           from './components/Sidebar';
import SettingsSidebar   from './components/SettingsSidebar';
import PrivateRoute      from './components/PrivateRoute';

import Login             from './pages/Login';
import Register          from './pages/Register';
import ForgotPassword    from './pages/ForgotPassword';
import ResetPassword     from './pages/ResetPassword';
import Landing           from './pages/Landing';
import Home              from './pages/Home';
import AdminImport       from './pages/AdminImport';
import CompanyPage       from './pages/CompanyPage';
import Profile           from './pages/Profile';
import Contact           from './pages/Contact';
import AskAIPage         from './pages/AskAIPage';
import SearchQuestions   from './pages/SearchQuestions';

// Settings-related imports
import Settings          from './pages/Settings';
import AccountSettings   from './pages/settings/AccountSettings';
import ColorSettings     from './pages/settings/ColorSettings';
import LeetCodeSettings  from './pages/settings/LeetCodeSettings';

function AppContent() {
  // ─── Sidebar open/closed state for non-settings routes ────────────────
  // Default to closed on mobile (<768px) and open otherwise
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const { syncing, syncResult, user, authChecked } = useAuth();
  const showToast = syncing || syncResult != null;

  // Determine if we are on any "/settings" route
  const location = useLocation();
  const onSettingsRoute = location.pathname.startsWith('/settings');

  if (!authChecked) {
    return null;
  }

  // Utility to detect mobile viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="h-screen flex flex-col">
      {showToast && <SyncToast />}

      {/* ─── Navbar (60px high) ──────────────────────────────────────────── */}
      <Navbar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
        closeSidebar={() => setSidebarOpen(false)}
      />

      {/* ─── Below Navbar: either SettingsSidebar or Sidebar + main content ─ */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {onSettingsRoute ? (
          <SettingsSidebar sidebarOpen={sidebarOpen} />
        ) : (
          <Sidebar sidebarOpen={sidebarOpen} />
        )}

        {sidebarOpen && isMobile && (
          <div
            className="md:hidden fixed inset-0 top-16 bg-black/30 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area gets the SVG pattern and dark background */}
        <main className="flex-1 overflow-auto p-4 main-screen-bg">
          <Routes>
            <Route path="/" element={user ? <Home /> : <Landing />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contact"  element={<Contact />} />

            <Route
              path="/import"
              element={
                <PrivateRoute>
                  <AdminImport />
                </PrivateRoute>
              }
            />

            <Route
              path="/company/:companyName"
              element={
                <PrivateRoute>
                  <CompanyPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route
              path="/ask-ai/:questionId"
              element={
                <PrivateRoute>
                  <AskAIPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <SearchQuestions />
                </PrivateRoute>
              }
            />

            {/* ─── Settings Routes ──────────────────────────────────────────── */}
            <Route
              path="/settings/*"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            >
              {/* Default to AccountSettings if no sub-path is provided */}
              <Route index element={<AccountSettings />} />
              <Route path="account"  element={<AccountSettings />} />
              <Route path="color"    element={<ColorSettings />} />
              <Route path="leetcode" element={<LeetCodeSettings />} />
            </Route>

            {/* Catch‐all: show Welcome under PrivateRoute */}
            <Route
              path="*"
              element={
                <PrivateRoute>
                  <Welcome />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function SyncToast() {
  const { syncing, syncResult } = useAuth();
  const [visible, setVisible] = useState(false);

  // Show toast immediately when a sync starts
  useEffect(() => {
    if (syncing) setVisible(true);
  }, [syncing]);

  // When sync completes, keep toast visible for 10 seconds
  useEffect(() => {
    let timerId;
    if (syncResult !== null) {
      setVisible(true);
      timerId = setTimeout(() => setVisible(false), 10000);
    }
    return () => clearTimeout(timerId);
  }, [syncResult]);

  const text = syncing
    ? 'Syncing solved questions…'
    : `Synced ${syncResult} questions`;

  return (
    <div
      className={`fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-code p-2 pl-3 shadow-elevation-md flex items-center z-50 text-gray-100 transform transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {syncing && (
        <div
          className="mr-2 border-2 border-gray-600 border-t-primary rounded-full w-4 h-4 animate-spin"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      )}
      <span className="pr-3">{text}</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-auto text-gray-400 hover:text-gray-200"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

function Welcome() {
  return (
    <div>
      <h2 className="text-xl text-gray-100">Welcome to LeetEase</h2>
      <p className="text-gray-300">Select a company from the sidebar to get started.</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorToastProvider>
          <AppContent />
        </ErrorToastProvider>
      </AuthProvider>
    </Router>
  );
}
