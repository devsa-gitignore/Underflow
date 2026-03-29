import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './Login';
import Dashboard from './Dashboard';
import PatientDirectory from './PatientDirectory';
import AddPatient from './AddPatient';
import EditPatient from './EditPatient';
import PatientProfile from './PatientProfile';
import TimelinePage from './TimelinePage';
import AlertsPage from './AlertsPage';
import TasksPage from './TasksPage';
import AdminDashboard from './AdminDashboard';
import Layout from './Layout';
import { LanguageProvider } from './LanguageProvider';
import { OfflineSyncProvider } from './OfflineSyncContext';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <OfflineSyncProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes inside Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/directory" element={<PatientDirectory />} />
              <Route path="/add-patient" element={<AddPatient />} />
              <Route path="/patient/:id" element={<PatientProfile />} />
              <Route path="/patient/:id/pregacare" element={<TimelinePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/patient/:id/edit" element={<EditPatient />} />
          </Route>
            
            {/* Standalone Route for Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </OfflineSyncProvider>
    </LanguageProvider>
  );
}

export default App

