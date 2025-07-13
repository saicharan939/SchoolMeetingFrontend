// frontend/src/Components/SlotPicker.js
import React, { useState } from 'react';
import axios from 'axios';

const SlotPicker = ({ roomId, onSlotConfirmed }) => {
  const [slotTime, setSlotTime] = useState(''); // State for the selected slot time
  const [submitted, setSubmitted] = useState(false); // State to track if slot has been submitted
  const [loading, setLoading] = useState(false); // State for loading indicator

  // Handles the confirmation of the selected time slot
  const handleConfirmSlot = async () => {
    if (!slotTime) {
      alert('Please select a time slot before submitting.');
      return;
    }
    setLoading(true); // Show loading indicator

    try {
      // Send the selected slot time to the backend for the given meeting ID
      await axios.post('http://192.168.1.22:3001/select-slot', {
        meetingId: roomId,
        slotTime
      });

      onSlotConfirmed(slotTime); // Notify parent component (MeetingApp) with the confirmed slot
      setSubmitted(true); // Mark as submitted
    } catch (error) {
      console.error('Error saving slot:', error.response?.data?.message || error.message);
      alert(`Error saving slot. Please try again: ${error.response?.data?.message || ''}`);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>Select a 30-minute Meeting Slot</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="time" // HTML5 time input for easy time selection
          value={slotTime}
          onChange={(e) => setSlotTime(e.target.value)}
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
          disabled={submitted || loading} // Disable if already submitted or loading
          style={{
            backgroundColor: '#007bff', // Blue color for submit
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            opacity: (submitted || loading) ? 0.7 : 1
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#007bff')}
        >
          {loading ? 'Submitting...' : (submitted ? 'Slot Confirmed' : 'Submit Slot')}
        </button>
      </div>
      {submitted && (
        <div style={{ marginTop: '15px', textAlign: 'center', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', color: '#155724' }}>
          <p style={{ margin: 0, fontSize: '15px' }}>Slot confirmed. Please wait for the "Join Meeting" button to appear when it's time.</p>
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
