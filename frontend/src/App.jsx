import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import PatientDirectory from './PatientDirectory';
import AddPatient from './AddPatient';
import PatientProfile from './PatientProfile';
<<<<<<< HEAD
import TimelinePage from './TimelinePage';
=======
import AdminDashboard from './AdminDashboard';
>>>>>>> 4ce5547d56033e2d4e8d88a460f37a70532b3d80
import Layout from './Layout';
import { LanguageProvider } from './LanguageProvider';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes inside Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/directory" element={<PatientDirectory />} />
            <Route path="/add-patient" element={<AddPatient />} />
            <Route path="/patient/:id" element={<PatientProfile />} />
            <Route path="/patient/:id/timeline" element={<TimelinePage />} />
          </Route>
          
          {/* Standalone Route for Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App

