import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import PatientDirectory from './PatientDirectory';
import AddPatient from './AddPatient';
import PatientProfile from './PatientProfile';
import TimelinePage from './TimelinePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directory" element={<PatientDirectory />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/patient/:id" element={<PatientProfile />} />
          <Route path="/patient/:id/timeline" element={<TimelinePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

