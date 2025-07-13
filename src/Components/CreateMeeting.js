// frontend/src/Components/CreateMeeting.js
import React, { useState } from 'react';
import axios from 'axios';

// Define the API URL using an environment variable
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

const CreateMeeting = ({ onCreated }) => {
  const [email, setEmail] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!email) {
      alert('Please enter a recipient email address.');
      return;
    }
    setLoading(true);
    try {
      // Use the environment variable for the backend URL
      const res = await axios.post(`${BACKEND_API_URL}/create-meeting`, { recipientEmail: email });
      alert('Meeting invitation sent to email!');
      setMeetingId(res.data.meetingId);
      onCreated(res.data.meetingId);
      setEmail('');
    } catch (err) {
      console.error('Error creating meeting:', err.response?.data?.message || err.message);
      alert(`Error sending invite: ${err.response?.data?.message || 'Please check console for details.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>Create & Invite New Meeting</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="email"
          placeholder="Recipient Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flexGrow: 1,
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#218838')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#28a745')}
        >
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </div>
      {meetingId && (
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
          Generated Meeting ID: <code style={{ backgroundColor: '#e9ecef', padding: '5px 8px', borderRadius: '4px' }}>{meetingId}</code>
          <br />
          Share this ID or the link from the email with participants.
        </p>
      )}
    </div>
  );
};

export default CreateMeeting;