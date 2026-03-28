import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import PatientDirectory from './PatientDirectory';
import AddPatient from './AddPatient';
import PatientProfile from './PatientProfile';
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
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App

