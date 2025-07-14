// frontend/src/Components/SlotPicker.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define the API URL using an environment variable
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://schoolmeetingbackend-production-b8a8.up.railway.app';

// Add whatsappLink as a prop here
const SlotPicker = ({ roomId, onSlotConfirmed, whatsappLink }) => { // <--- ADDED whatsappLink PROP
  const [selectedSlot, setSelectedSlot] = useState(''); // Initialize with empty string for time input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState(''); // To show success message after slot confirmed

  // Keeping this useEffect for consistency, though it might not be strictly necessary
  // if you're not fetching predefined slots.
  useEffect(() => {
    // If you need to fetch available slots, uncomment and implement this:
    // axios.get(`${BACKEND_API_URL}/available-slots/${roomId}`)
    //     .then(res => {
    //         setAvailableSlots(res.data.slots);
    //         setLoading(false);
    //     })
    //     .catch(err => {
    //         console.error("Error fetching slots:", err);
    //         setError('Failed to fetch available slots.');
    //         setLoading(false);
    //     });
  }, [roomId]);


  const handleConfirmSlot = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot before submitting.');
      return;
    }
    setLoading(true);
    setError(''); // Clear previous errors
    setResponseMessage(''); // Clear previous response messages

    try {
      const res = await axios.post(`${BACKEND_API_URL}/select-slot`, {
        meetingId: roomId,
        slotTime: selectedSlot
      });

      if (res.data.success) { // Assuming your backend returns a success flag
        setResponseMessage(res.data.message || 'Slot confirmed successfully!');
        onSlotConfirmed(selectedSlot); // Pass selected slot back to parent
      } else {
        setError(res.data.message || 'Failed to confirm slot.');
      }

    } catch (error) {
      console.error('Error saving slot:', error.response?.data?.message || error.message);
      setError(`Error saving slot. Please try again: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>Select a 30-minute Meeting Slot for ID: {roomId}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="time"
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          style={{
            flexGrow: 1,
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <button
          onClick={handleConfirmSlot}
          disabled={!selectedSlot || loading || responseMessage} // Disable if no slot selected, loading, or already confirmed
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            opacity: (!selectedSlot || loading || responseMessage) ? 0.7 : 1
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#007bff')}
        >
          {loading ? 'Submitting...' : (responseMessage ? 'Slot Confirmed' : 'Submit Slot')}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: '15px', fontSize: '14px', color: 'red' }}>
          Error: {error}
        </p>
      )}

      {responseMessage && ( // Show success message after slot confirmation
        <div style={{ marginTop: '15px', textAlign: 'center', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', color: '#155724' }}>
          <p style={{ margin: 0, fontSize: '15px' }}>{responseMessage}</p>
        </div>
      )}

      {/* --- THIS IS THE WHATSAPP BUTTON --- */}
      {whatsappLink && responseMessage && ( // Only show if whatsappLink is available AND a slot has been successfully confirmed (responseMessage)
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', fontSize: '15px', color: '#555' }}>
            Share this meeting invitation with the participant:
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: '#25D366', // WhatsApp green
              color: 'white',
              padding: '10px 15px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#1DA851')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#25D366')}
          >
            Share via WhatsApp 💬
          </a>
        </div>
      )}
      {/* --- END WHATSAPP BUTTON --- */}

    </div>
  );
};

export default SlotPicker;