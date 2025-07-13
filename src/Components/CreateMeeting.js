// frontend/src/Components/CreateMeeting.js
import React, { useState } from 'react';
import axios from 'axios';

const CreateMeeting = ({ onCreated }) => {
  const [email, setEmail] = useState(''); // State for recipient email
  const [meetingId, setMeetingId] = useState(''); // State to display generated meeting ID
  const [loading, setLoading] = useState(false); // State for loading indicator

  // Handles the creation of a new meeting and sending an invitation email
  const handleCreate = async () => {
    if (!email) {
      alert('Please enter a recipient email address.');
      return;
    }
    setLoading(true); // Show loading indicator
    try {
      // Make a POST request to the backend to create a meeting
      const res = await axios.post('http://192.168.1.22:3001/create-meeting', { recipientEmail: email });
      alert('Meeting invitation sent to email!');
      setMeetingId(res.data.meetingId); // Store and display the generated meeting ID
      onCreated(res.data.meetingId); // Notify parent component (MeetingApp) about the new meeting ID
      setEmail(''); // Clear the email input
    } catch (err) {
      console.error('Error creating meeting:', err.response?.data?.message || err.message);
      alert(`Error sending invite: ${err.response?.data?.message || 'Please check console for details.'}`);
    } finally {
      setLoading(false); // Hide loading indicator
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
          disabled={loading} // Disable button while loading
          style={{
            backgroundColor: '#28a745', // Green color for create
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
