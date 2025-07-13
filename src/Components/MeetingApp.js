// frontend/src/Components/MeetingApp.js
import React, { useRef, useState, useEffect } from 'react';
import { Download, Share, ArrowLeft } from 'lucide-react'; // Icons from Lucide React
import html2canvas from 'html2canvas'; // For capturing HTML content as an image
import jsPDF from 'jspdf'; // For generating PDF from image
import axios from 'axios'; // For making HTTP requests
import { useNavigate, useParams } from 'react-router-dom'; // React Router hooks
import VideoCall from './VideoCall'; // Import the video call component
import CreateMeeting from './CreateMeeting'; // Import the create meeting component
import SlotPicker from './SlotPicker'; // Import the slot picker component
import '../App.css'; // Import global CSS for layout (sidebar, header etc.)

// Optional custom logo source
const schoolLogo = ""; // You can put a URL or path here, e.g., "/images/my-school-logo.png"

const MeetingApp = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  // Extract meetingId from URL parameters (e.g., /schedule/YOUR_ID)
  const { meetingId: urlMeetingId } = useParams();

  // State variables for meeting logic
  const [roomId, setRoomId] = useState(''); // Stores the current meeting ID
  const [joined, setJoined] = useState(false); // True if the user has successfully joined the call
  const [expired, setExpired] = useState(false); // True if the meeting link has expired
  const [error, setError] = useState(''); // Stores error messages
  const [confirmedSlot, setConfirmedSlot] = useState(''); // Stores the confirmed meeting time slot
  const [slotConfirmed, setSlotConfirmed] = useState(false); // True if a slot has been confirmed
  const [canJoin, setCanJoin] = useState(false); // True if user can click "Join Meeting" button
  const [countdown, setCountdown] = useState(0); // Countdown in seconds until join time

  // New state to manage the current view: 'initial' (Create/Join), 'slotPicker', 'videoCall'
  const [viewMode, setViewMode] = useState('initial');

  // Ref for the content area to be downloaded as PDF
  const mainContentRef = useRef(null);
  // Default logo source if schoolLogo is not provided
  const logoSrc = schoolLogo || "/default-logo.png";

  // useEffect hook to handle initial setup based on URL parameters
  useEffect(() => {
    // If a meetingId is present in the URL (e.g., from SchoolList or direct link)
    if (urlMeetingId) {
      setRoomId(urlMeetingId); // Set the roomId from the URL
      // Validate the meeting ID with the backend to check its status and slot time
      axios.get(`http://192.168.1.22:3001/validate-meeting/${urlMeetingId}`)
        .then(res => {
          if (res.data.valid) {
            // If the meeting is valid
            if (res.data.slotTime) {
              // If a slot is already confirmed for this meeting, transition to slotPicker view
              setConfirmedSlot(res.data.slotTime);
              setSlotConfirmed(true);
              enableJoinButton(res.data.slotTime);
              setViewMode('slotPicker'); // Show slot picker with countdown
            } else {
              // If valid but no slot confirmed yet, also transition to slotPicker view
              setViewMode('slotPicker'); // Show slot picker for user to select a slot
            }
          } else {
            // If the meeting is invalid or expired, show error and set expired flag
            setExpired(true);
            setError(res.data.message || 'Meeting link is invalid or expired.');
          }
        })
        .catch(err => {
          console.error('Error validating meeting:', err);
          setExpired(true);
          setError('Could not validate meeting link. Please try again.');
        });
    } else {
      // If no meetingId in URL, default to 'initial' view (Create/Join)
      setViewMode('initial');
    }
  }, [urlMeetingId]); // This effect runs whenever the urlMeetingId changes

  // Function to enable the "Join Meeting" button based on the confirmed slot time
  const enableJoinButton = (slotTime) => {
    const [hours, minutes] = slotTime.split(':').map(Number);
    const now = new Date();
    // Create a Date object for the scheduled slot time today
    let slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    // If the slot time for today has already passed, consider the slot for the next day
    if (slotDate.getTime() < now.getTime()) {
      slotDate.setDate(slotDate.getDate() + 1);
    }

    // Calculate the time 3 minutes before the scheduled slot time
    const joinTime = slotDate.getTime() - 3 * 60 * 1000; // 3 minutes before

    // Set up an interval to continuously check the time until the join time
    const interval = setInterval(() => {
      const diff = joinTime - Date.now(); // Time difference in milliseconds
      if (diff <= 0) {
        setCanJoin(true); // Enable the join button
        setCountdown(0); // Set countdown to 0
        clearInterval(interval); // Stop the interval
      } else {
        setCountdown(Math.ceil(diff / 1000)); // Update countdown in seconds
      }
    }, 1000); // Check every second

    // Cleanup function for the interval
    return () => clearInterval(interval);
  };

  // Handles joining the meeting
  const handleJoin = async () => {
    try {
      // Re-validate the meeting ID before joining
      const res = await axios.get(`http://192.168.1.22:3001/validate-meeting/${roomId}`);
      if (res.data.valid) {
        // If valid and a slot is already confirmed, proceed to video call
        if (res.data.slotTime) {
          setConfirmedSlot(res.data.slotTime);
          setSlotConfirmed(true);
          enableJoinButton(res.data.slotTime);
          setViewMode('slotPicker'); // Go to slot picker to show countdown/join button
        } else {
          // If valid but no slot confirmed, go to slot picker to select one
          setViewMode('slotPicker');
        }
      } else {
        setError(res.data.message || 'Meeting is no longer valid.');
      }
    } catch (err) {
      console.error('Error joining meeting:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to join meeting. Please try again.');
    }
  };

  // Callback function when a slot is confirmed in SlotPicker
  const handleSlotConfirmed = (slotTime) => {
    setConfirmedSlot(slotTime); // Store the confirmed slot time
    setSlotConfirmed(true); // Mark slot as confirmed
    enableJoinButton(slotTime); // Start the countdown for the join button
  };

  // Callback function when a new meeting is created in CreateMeeting
  const handleCreatedMeeting = (id) => {
    setRoomId(id); // Set the new meeting ID
    setViewMode('slotPicker'); // Transition to slot picker view for the creator to schedule
  };

  // Handles the back button click
  const handleBackClick = () => {
    navigate('/'); // Navigate back to the SchoolList page
  };

  // Handles sharing the current page URL
  const handleShare = async () => {
    const shareData = {
      title: 'Meeting Invitation',
      text: `Join my meeting: ${window.location.href}`,
      url: window.location.href,
    };

    try {
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Content shared successfully');
      } else {
        // Fallback for browsers that don't support Web Share API
        alert('Web Share API is not supported in this browser. You can manually copy the URL.');
        // Optionally, copy to clipboard here
        // navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share content.');
    }
  };

  // Handles downloading the main content as a PDF
  const handleDownload = () => {
    const content = mainContentRef.current; // Get the DOM element to capture

    // Set a scale factor for better resolution in the PDF
    const scale = 2;

    html2canvas(content, {
      scale: scale,
      useCORS: true, // Essential for handling images from different origins
      logging: false // Disable logging for cleaner console
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png'); // Convert canvas to PNG image data
      const doc = new jsPDF('p', 'mm', 'a4'); // Create a new A4 PDF document (portrait, millimeters)

      const imgWidth = 210; // A4 width in mm
      // Calculate image height to maintain aspect ratio
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the image to the PDF, starting from the top-left corner
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      doc.save('dashboard.pdf'); // Save the PDF with a filename
    }).catch(err => {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    });
  };

  // Render an error message if the meeting link has expired
  if (expired) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: '50px',
        padding: '20px',
        backgroundColor: '#ffe0e0',
        border: '1px solid #ff0000',
        borderRadius: '8px',
        color: '#ff0000',
        maxWidth: '500px',
        margin: '50px auto',
        boxShadow: '0 2px 10px rgba(255, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: 0 }}>Meeting Link Expired or Invalid</h2>
        <p style={{ marginTop: '10px' }}>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go to School List
        </button>
      </div>
    );
  }

  // Main rendering logic based on viewMode and joined state
  const renderContent = () => {
    if (joined) {
      return <VideoCall roomId={roomId} />;
    }

    switch (viewMode) {
      case 'initial':
        return (
          <>
            <CreateMeeting onCreated={handleCreatedMeeting} />
            <h3 style={{ marginTop: '30px', color: '#333' }}>Or Join an Existing Meeting by ID</h3>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <input
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setError(''); // Clear error when typing
                  setSlotConfirmed(false); // Reset slot confirmed state
                  setCanJoin(false); // Reset canJoin state
                  setCountdown(0); // Reset countdown
                }}
                placeholder="Enter Meeting ID"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  width: '280px',
                  fontSize: '16px',
                  transition: 'border 0.3s, box-shadow 0.3s',
                }}
                onFocus={(e) => { e.target.style.border = '1px solid #007bff'; e.target.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,.25)'; }}
                onBlur={(e) => { e.target.style.border = '1px solid #ddd'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                onClick={handleJoin}
                disabled={!roomId} // Disable if no room ID is entered
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'background-color 0.3s, transform 0.2s',
                  opacity: !roomId ? 0.7 : 1
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#007bff')}
              >
                Join
              </button>
            </div>
            {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>}
          </>
        );
      case 'slotPicker':
        return (
          <>
            <SlotPicker
              roomId={roomId}
              onSlotConfirmed={handleSlotConfirmed}
            />
            {slotConfirmed && ( // If slot is confirmed, show countdown and join button
              <div style={{ marginTop: '20px', textAlign: 'center', padding: '15px', backgroundColor: '#e9f7ef', borderRadius: '8px', border: '1px solid #d0e9e0' }}>
                <h4 style={{ color: '#28a745', fontSize: '18px', marginBottom: '10px' }}>Confirmed Slot: {confirmedSlot}</h4>
                {canJoin ? ( // If it's time to join
                  <button
                    onClick={() => setJoined(true)} // Directly set joined to true to render VideoCall
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      borderRadius: '8px', // More rounded
                      marginTop: '15px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 8px rgba(0, 123, 255, 0.2)',
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#0056b3'; e.target.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#007bff'; e.target.style.transform = 'translateY(0)'; }}
                  >
                    Join Meeting Now!
                  </button>
                ) : ( // If waiting for join time
                  <p style={{ fontSize: '16px', color: '#6c757d', margin: '10px 0 0 0' }}>
                    Meeting will start soon. Waiting... <strong style={{ color: '#007bff' }}>{countdown}</strong> seconds left to join
                  </p>
                )}
              </div>
            )}
          </>
        );
      default:
        return null; // Should not happen
    }
  };

  return (
    <>
      {/* Top Bar */}
      <header className="top-bar">
        <div className="left-section">
          {/* Display school logo */}
          <img src={logoSrc} alt="School Logo" style={{ height: '40px', borderRadius: '50%' }} onError={(e) => { e.target.onerror = null; e.target.src = "/default-logo.png" }} />
          <span style={{ marginLeft: '10px', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>School App</span>
        </div>
        {/* You can add right-section content here if needed */}
      </header>

      <div className="outer-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="logo"></div> {/* Placeholder for a larger logo if desired */}
          <nav className="nav-icons">
            {/* Font Awesome icons (ensure Font Awesome is linked in public/index.html or via CDN) */}
            <i className="fa fa-cogs" title="Operations"></i>
            <i className="fa fa-bullhorn" title="Marketing"></i>
            <i className="fa fa-shopping-cart" title="Commerce"></i>
            <i className="fa fa-wrench" title="Services"></i>
            <i className="fa fa-headphones" title="Support"></i>
            <i className="fa fa-cog" title="Settings"></i>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="main-content" ref={mainContentRef}> {/* Apply ref here for PDF download */}
          {/* Header within main content */}
          <div className="header">
            <div className="header-left">
              <button className="btn-back" onClick={handleBackClick}>
                <ArrowLeft size={18} />
                Back to Schools
              </button>
            </div>
            <div className="header-right">
              <button className="btn-share" onClick={handleShare}>
                <Share size={18} />
                Share
              </button>
              <button className="btn-download" onClick={handleDownload}>
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
          <div className="section-divider"></div> {/* Visual separator */}

          {/* Conditional rendering for meeting logic */}
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              fontFamily: 'Inter, Arial, sans-serif', // Using Inter font
              backgroundColor: '#fff',
              borderRadius: '12px', // Rounded corners
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)', // Enhanced shadow
              maxWidth: '800px', // Increased max-width for better layout
              margin: '50px auto', // Centered with margin
              border: '1px solid #e0e0e0'
            }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingApp;
