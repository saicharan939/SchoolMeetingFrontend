// frontend/src/Components/CreateMeeting.js
import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://schoolmeetingbackend-production-b8a8.up.railway.app';

const CreateMeeting = ({ onCreated }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    setError(null);
    setMeetingId('');

    if (!phoneNumber.trim()) {
      setError('Please enter a recipient phone number.');
      return;
    }

    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    setLoading(true);
    try {
      // Step 1: Create the meeting in your backend
      const createMeetingRes = await axios.post(`${BACKEND_API_URL}/create-meeting`, {
        recipientPhoneNumber: formattedPhoneNumber
      });

      if (createMeetingRes.data.success) {
        const { meetingLink, meetingId, recipientPhoneNumber: returnedPhoneNumber } = createMeetingRes.data;

        setMeetingId(meetingId);

        // Step 2: Trigger the automated WhatsApp message send via your backend's Twilio endpoint
        try {
          const expirationText = "30 minutes"; // Customize this based on your link expiry logic
          const sendWhatsappRes = await axios.post(`${BACKEND_API_URL}/send-whatsapp-invite-twilio`, { // <--- CALLING NEW TWILIO ENDPOINT
            recipientPhoneNumber: returnedPhoneNumber,
            meetingLink: meetingLink,
            meetingId: meetingId,
            expirationTime: expirationText
          });

          if (sendWhatsappRes.data.success) {
            alert('Meeting created and WhatsApp invitation sent successfully via Twilio!');
            onCreated(meetingId);
          } else {
            setError(sendWhatsappRes.data.message || 'Failed to send WhatsApp invitation via Twilio.');
          }
        } catch (whatsappErr) {
          console.error('Error triggering WhatsApp send via Twilio backend:', whatsappErr.response?.data?.message || whatsappErr.message);
          setError(whatsappErr.response?.data?.message || 'An error occurred while sending WhatsApp invitation via Twilio.');
        }

        setPhoneNumber('');
      } else {
        setError(createMeetingRes.data.message || 'Failed to create meeting.');
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

      {meetingId && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e9f7ef', borderLeft: '5px solid #28a745', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold', color: '#28a745' }}>Meeting Created!</p>
          <p>Generated Meeting ID: <code style={{ backgroundColor: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{meetingId}</code></p>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
            (WhatsApp invitation sent automatically. Now proceed to select a slot.)
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateMeeting;