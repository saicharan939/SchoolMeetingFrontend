// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SchoolList from './Components/SchoolList';
import MeetingApp from './Components/MeetingApp';
import './App.css'; // Import global CSS

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for displaying the list of schools */}
        <Route path="/" element={<SchoolList />} />
        {/* Route for the meeting application with a specific meeting ID */}
        <Route path="/schedule/:meetingId" element={<MeetingApp />} />
        {/* NEW: Route for the meeting application without a specific meeting ID.
            This will allow /schedule/ to load the MeetingApp, which then defaults to 'initial' view. */}
        <Route path="/schedule/" element={<MeetingApp />} />
        {/* You can add more routes here if your application expands */}
      </Routes>
    </Router>
  );
}

export default App;
