import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CareersPage from './pages/CareersPage';
import JobDetailPage from './pages/JobDetailPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<CareersPage />} />
          <Route path="/:companySlug/jobs" element={<CareersPage />} />
          <Route path="/:companySlug/jobs/:jobSlug" element={<JobDetailPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;