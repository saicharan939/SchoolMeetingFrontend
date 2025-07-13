// frontend/src/Components/VideoCall.js
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer'; // Peer-to-peer connection library
import io from 'socket.io-client'; // Socket.IO client for signaling

// Connect to the Socket.IO server
const socket = io('http://192.168.1.22::3010');

const VideoCall = ({ roomId }) => {
  const localVideoRef = useRef(null); // Ref for local video element
  const remoteVideoRef = useRef(null); // Ref for remote video element
  const [stream, setStream] = useState(null); // State for local media stream
  const [peer, setPeer] = useState(null); // State for the simple-peer instance
  const [audioEnabled, setAudioEnabled] = useState(true); // State for audio toggle
  const [videoEnabled, setVideoEnabled] = useState(true); // State for video toggle
  const [messages, setMessages] = useState([]); // State for chat messages (if chat was implemented)
  const [newMessage, setNewMessage] = useState(''); // State for new chat message input

  useEffect(() => {
    // Request access to user's media devices (webcam and microphone)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream); // Set the local media stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream; // Display local stream in video element
        }

        // Emit 'join-room' event to the Socket.IO server
        socket.emit('join-room', roomId);

        // Listen for 'user-joined' event from the server
        socket.on('user-joined', (userId) => {
          console.log(`User ${userId} joined the room. Initiating call.`);
          // Create a new Peer instance to initiate a call to the joined user
          const newPeer = createPeer(userId, socket.id, mediaStream);
          setPeer(newPeer); // Store the peer instance
        });

        // Listen for 'receive-call' event (incoming call offer)
        socket.on('receive-call', (payload) => {
          console.log(`Receiving call from ${payload.callerId}.`);
          // Add a new Peer instance to answer the incoming call
          const newPeer = addPeer(payload.signal, mediaStream);
          setPeer(newPeer); // Store the peer instance
        });

        // Listen for 'call-accepted' event (answer to our offer)
        socket.on('call-accepted', (payload) => {
          console.log(`Call accepted by ${payload.id}. Signaling back.`);
          // Signal the existing peer with the received answer
          peer?.signal(payload.signal);
        });

        // Listen for 'chat-message' event (if chat was implemented)
        socket.on('chat-message', (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
      })
      .catch(error => {
        console.error("Error accessing media devices:", error);
        alert("Could not access camera/microphone. Please ensure permissions are granted.");
      });

    // Cleanup function: disconnect socket when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop all media tracks
      }
      if (peer) {
        peer.destroy(); // Destroy the peer connection
      }
      socket.disconnect(); // Disconnect from Socket.IO server
      console.log("VideoCall component unmounted, socket disconnected.");
    };
  }, [roomId, peer]); // Re-run if roomId changes, or if peer instance changes (for signaling)

  // Function to create a simple-peer instance (initiator)
  const createPeer = (userToSignal, callerId, mediaStream) => {
    const newPeer = new Peer({
      initiator: true, // This peer initiates the connection
      trickle: false, // Use full SDP offers/answers, not trickle ICE candidates
      stream: mediaStream, // Attach local media stream
    });

    // When the peer generates a signaling offer
    newPeer.on('signal', (signal) => {
      // Send the offer to the other user via the Socket.IO server
      socket.emit('send-call', { userToSignal, callerId, signal });
    });

    // When the peer receives a remote stream
    newPeer.on('stream', (remoteStream) => {
      console.log('Received remote stream.');
      // Display the remote stream in the remote video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    // Handle peer errors
    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    return newPeer;
  };

  // Function to add a simple-peer instance (non-initiator, answering a call)
  const addPeer = (incomingSignal, mediaStream) => {
    const newPeer = new Peer({
      initiator: false, // This peer answers the connection
      trickle: false,
      stream: mediaStream, // Attach local media stream
    });

    // When the peer generates a signaling answer
    newPeer.on('signal', (signal) => {
      // Send the answer back to the caller via the Socket.IO server
      socket.emit('accept-call', { callerId: incomingSignal.callerId, signal });
    });

    // When the peer receives a remote stream
    newPeer.on('stream', (remoteStream) => {
      console.log('Received remote stream.');
      // Display the remote stream in the remote video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    // Handle peer errors
    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    // Signal the peer with the incoming offer
    newPeer.signal(incomingSignal);
    return newPeer;
  };

  // Toggle local audio track
  const toggleAudio = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    });
  };

  // Toggle local video track
  const toggleVideo = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      gap: '20px',
      backgroundColor: '#f0f2f5',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ color: '#333' }}>Meeting Room: {roomId}</h3>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Local Video Stream */}
        <div style={{
          border: '3px solid #4CAF50',
          borderRadius: '10px',
          padding: '10px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Your Video</h4>
          <video
            ref={localVideoRef}
            autoPlay
            muted // Mute local video to prevent echo
            playsInline
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: '6px',
              backgroundColor: '#000' // Background for when no stream
            }}
          />
        </div>

        {/* Remote Video Stream */}
        <div style={{
          border: '3px solid #2196F3',
          borderRadius: '10px',
          padding: '10px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>Participant's Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: '6px',
              backgroundColor: '#000' // Background for when no stream
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
        <button
          onClick={toggleAudio}
          style={{
            backgroundColor: audioEnabled ? '#dc3545' : '#6c757d', // Red for mute, grey for unmute
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = audioEnabled ? '#c82333' : '#5a6268')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = audioEnabled ? '#dc3545' : '#6c757d')}
        >
          {audioEnabled ? 'Mute Mic 🔇' : 'Unmute Mic 🎤'}
        </button>
        <button
          onClick={toggleVideo}
          style={{
            backgroundColor: videoEnabled ? '#dc3545' : '#6c757d', // Red for turn off, grey for turn on
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = videoEnabled ? '#c82333' : '#5a6268')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = videoEnabled ? '#dc3545' : '#6c757d')}
        >
          {videoEnabled ? 'Turn Off Camera 📷' : 'Turn On Camera 📹'}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
