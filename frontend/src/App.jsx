import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadResume from './pages/UploadResume';
import CandidateRepository from './pages/CandidateRepository';
import CandidateProfile from './pages/CandidateProfile';
import JobDescriptions from './pages/JobDescriptions';
import RankingBoard from './pages/RankingBoard';
import SkillGapAnalysis from './pages/SkillGapAnalysis';
import InterviewStudio from './pages/InterviewStudio';
import Reports from './pages/Reports';
import SystemMonitoring from './pages/SystemMonitoring';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside DashboardLayout */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<UploadResume />} />
            <Route path="candidates" element={<CandidateRepository />} />
            <Route path="candidates/:cid" element={<CandidateProfile />} />
            <Route path="jobs" element={<JobDescriptions />} />
            <Route path="ranking" element={<RankingBoard />} />
            <Route path="gaps" element={<SkillGapAnalysis />} />
            <Route path="interview" element={<InterviewStudio />} />
            <Route path="reports" element={<Reports />} />
            <Route path="monitoring" element={<SystemMonitoring />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
