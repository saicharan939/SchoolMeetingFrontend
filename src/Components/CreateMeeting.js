// frontend/src/Components/CreateMeeting.js
import React, { useState } from 'react';
import axios from 'axios';

// Define the API URL using an environment variable
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://schoolmeetingbackend-production-b8a8.up.railway.app'; // Added fallback

const CreateMeeting = ({ onCreated }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    setError(null);
    setWhatsappLink('');
    setMeetingId('');

    if (!phoneNumber.trim()) {
      setError('Please enter a recipient phone number.');
      return;
    }

    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_API_URL}/create-meeting`, {
        recipientPhoneNumber: formattedPhoneNumber
      });

      if (res.data.success) {
        const { meetingLink, meetingId, recipientPhoneNumber: returnedPhoneNumber } = res.data;

        const encodedMessage = encodeURIComponent(
          `You've been invited to a meeting!\n\nClick here to join: ${meetingLink}\n\nMeeting ID: ${meetingId}\n\nThis invitation link will expire in 30 minutes.`
        );

        const generatedWaMeLink = `https://wa.me/${returnedPhoneNumber.replace(/\+/g, '')}?text=${encodedMessage}`;

        setMeetingId(meetingId);
        setWhatsappLink(generatedWaMeLink);
        console.log("CreateMeeting: Generated WhatsApp Link:", generatedWaMeLink); // Keep this for debugging

        alert('Meeting created! Now share the link via WhatsApp.');
        onCreated(meetingId, generatedWaMeLink); // <--- IMPORTANT CHANGE HERE: Passing whatsappLink
        setPhoneNumber('');
      } else {
        setError(res.data.message || 'Failed to create meeting.');
      }
    } catch (err) {
      console.error('Error creating meeting:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'An error occurred. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>Create & Invite New Meeting</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="tel"
          placeholder="Recipient WhatsApp Number (e.g., +919876543210)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
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
          {loading ? 'Creating...' : 'Create Meeting'}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: '15px', fontSize: '14px', color: 'red' }}>
          Error: {error}
        </p>
      )}

      {/* This section will no longer show the WhatsApp button, as it's moved to SlotPicker */}
      {meetingId && whatsappLink && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e9f7ef', borderLeft: '5px solid #28a745', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold', color: '#28a745' }}>Meeting Created!</p>
          <p>Generated Meeting ID: <code style={{ backgroundColor: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{meetingId}</code></p>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
            (Now proceed to select a slot, and the share option will appear.)
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateMeeting;