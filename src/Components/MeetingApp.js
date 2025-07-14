// frontend/src/Components/MeetingApp.js
import React, { useRef, useState, useEffect } from 'react'; // <--- ADD useRef here
import { Download, Share, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import VideoCall from './VideoCall';
import CreateMeeting from './CreateMeeting';
import SlotPicker from './SlotPicker';
import schoolLogo from '../assets/images/image.png'
import '../App.css';

// Define the API URL using an environment variable
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://schoolmeetingbackend-production-b8a8.up.railway.app'; // Added fallback
// If Socket.IO uses a different URL (though likely same as API on Railway)
const SOCKET_IO_URL = process.env.REACT_APP_SOCKET_URL; // Add this if you use a separate one for socket.io initialization

const MeetingApp = () => {
  const navigate = useNavigate();
  const { meetingId: urlMeetingId } = useParams();

  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const [confirmedSlot, setConfirmedSlot] = useState('');
  const [slotConfirmed, setSlotConfirmed] = useState(false);
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [viewMode, setViewMode] = useState('initial');
  const [createdWhatsappLink, setCreatedWhatsappLink] = useState('');

  const mainContentRef = useRef(null); // <--- IMPORTANT: ADD THIS LINE

  console.log("MeetingApp rendering. Current joined state:", joined);
  console.log("MeetingApp rendering. Current viewMode:", viewMode);

  useEffect(() => {
    console.log("MeetingApp useEffect triggered. urlMeetingId:", urlMeetingId);
    console.log("MeetingApp useEffect: joined state on effect run:", joined);
    console.log("MeetingApp useEffect: viewMode state on effect run:", viewMode);


    if (urlMeetingId) {
      setRoomId(urlMeetingId);
      // Use the environment variable for the backend URL
      axios.get(`${BACKEND_API_URL}/validate-meeting/${urlMeetingId}`)
        .then(res => {
          if (res.data.valid) {
            if (res.data.slotTime) {
              setConfirmedSlot(res.data.slotTime);
              setSlotConfirmed(true);
              enableJoinButton(res.data.slotTime);
              setViewMode('slotPicker');
            } else {
              setViewMode('slotPicker');
            }
          } else {
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
      setViewMode('initial');
    }
  }, [urlMeetingId]);

  const enableJoinButton = (slotTime) => {
    const [hours, minutes] = slotTime.split(':').map(Number);
    const now = new Date();
    let slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    if (slotDate.getTime() < now.getTime()) {
      slotDate.setDate(slotDate.getDate() + 1);
    }

    const joinTime = slotDate.getTime() - 3 * 60 * 1000;

    const interval = setInterval(() => {
      const diff = joinTime - Date.now();
      if (diff <= 0) {
        setCanJoin(true);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(Math.ceil(diff / 1000));
      }
    }, 1000);

  };

  const handleJoin = async () => {
    try {
      const res = await axios.get(`${BACKEND_API_URL}/validate-meeting/${roomId}`);
      if (res.data.valid) {
        if (res.data.slotTime) {
          setConfirmedSlot(res.data.slotTime);
          setSlotConfirmed(true);
          enableJoinButton(res.data.slotTime);
          setViewMode('slotPicker');
        } else {
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

  const handleSlotConfirmed = (slotTime) => {
    setConfirmedSlot(slotTime);
    setSlotConfirmed(true);
    enableJoinButton(slotTime);
  };

  const handleCreatedMeeting = (id, whatsappLinkFromCreate) => {
    setRoomId(id);
    setCreatedWhatsappLink(whatsappLinkFromCreate);
    setViewMode('slotPicker');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Meeting Invitation',
      text: `Join my meeting: ${window.location.href}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Content shared successfully');
      } else {
        alert('Web Share API is not supported in this browser. You can manually copy the URL.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share content.');
    }
  };

  const handleDownload = () => {
    const content = mainContentRef.current;
    const scale = 2;

    html2canvas(content, {
      scale: scale,
      useCORS: true,
      logging: false
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      doc.save('dashboard.pdf');
    }).catch(err => {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    });
  };

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

  const renderContent = () => {
    console.log("renderContent function called. Current joined state:", joined);
    console.log("renderContent function called. Current viewMode:", viewMode);

    if (joined) {
      console.log("RENDER CONTENT: Returning VideoCall component.");
      return <VideoCall roomId={roomId} />;
    }

    switch (viewMode) {
      case 'initial':
        return (
          <>
            <CreateMeeting onCreated={(id, whatsappLink) => handleCreatedMeeting(id, whatsappLink)} />
            <h3 style={{ marginTop: '30px', color: '#333' }}>Or Join an Existing Meeting by ID</h3>
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <input
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setError('');
                  setSlotConfirmed(false);
                  setCanJoin(false);
                  setCountdown(0);
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
                disabled={!roomId}
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
              whatsappLink={createdWhatsappLink}
            />
            {slotConfirmed && (
              <div style={{ marginTop: '20px', textAlign: 'center', padding: '15px', backgroundColor: '#e9f7ef', borderRadius: '8px', border: '1px solid #d0e9e0' }}>
                <h4 style={{ color: '#28a745', fontSize: '18px', marginBottom: '10px' }}>Confirmed Slot: {confirmedSlot}</h4>
                {canJoin ? (
                  <button
                    onClick={() => {
                      console.log("Button Clicked: Setting joined to true!");
                      setJoined(true);
                    }}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      borderRadius: '8px',
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
                ) : (
                  <p style={{ fontSize: '16px', color: '#6c757d', margin: '10px 0 0 0' }}>
                    Meeting will start soon. Waiting... <strong style={{ color: '#007bff' }}>{countdown}</strong> seconds left to join
                  </p>
                )}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="top-bar">
        <div className="left-section">
          <img src={schoolLogo} alt="School Logo" style={{ height: '40px', borderRadius: '50%' }} onError={(e) => { e.target.onerror = null; e.target.src = "src/assets/images/image.png" }} />
          <span style={{ marginLeft: '10px', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>School App</span>
        </div>
      </header>

      <div className="outer-container">
        <aside className="sidebar">
          <div className="logo"></div>
          <nav className="nav-icons">
            <i className="fa fa-cogs" title="Operations"></i>
            <i className="fa fa-bullhorn" title="Marketing"></i>
            <i className="fa fa-shopping-cart" title="Commerce"></i>
            <i className="fa fa-wrench" title="Services"></i>
            <i className="fa fa-headphones" title="Support"></i>
            <i className="fa fa-cog" title="Settings"></i>
          </nav>
        </aside>

        <div className="main-content" ref={mainContentRef}> {/* mainContentRef is used here */}
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
          <div className="section-divider"></div>

          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              fontFamily: 'Inter, Arial, sans-serif',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
              maxWidth: '800px',
              margin: '50px auto',
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