// frontend/src/Components/VideoCall.js
import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

// Define the Socket.IO URL using an environment variable
// Ensure you have REACT_APP_SOCKET_URL set in your .env file on Vercel and locally.
const SOCKET_IO_URL = process.env.REACT_APP_SOCKET_URL || 'https://schoolmeetingbackend-production-b8a8.up.railway.app';

const VideoCall = ({ roomId }) => {
  const socketRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(); // This will store the SimplePeer instance
  const localStreamRef = useRef(); // ADDED: To store the local media stream object
  const remoteStreamRef = useRef(); // ADDED: To store the remote media stream object

  // Use state for UI-related toggles and data that causes re-renders
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [messages, setMessages] = useState([]); // Assuming a chat feature might be here
  const [socketConnected, setSocketConnected] = useState(false); // NEW: Socket connection status

  // This is the main useEffect that handles all setup and cleanup
  useEffect(() => {
    // 1. Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_IO_URL); // CORRECTED: Use SOCKET_IO_URL
      console.log(`VideoCall: Attempting Socket.IO connection to: ${SOCKET_IO_URL}`);

      // NEW: Socket connection event listeners - CRUCIAL FOR DEBUGGING
      socketRef.current.on('connect', () => {
        console.log('VideoCall: Socket connected! ID:', socketRef.current.id);
        setSocketConnected(true); // Update state to connected
        // Only emit 'join-room' AFTER successful connection
        socketRef.current.emit('join-room', roomId);
        console.log(`VideoCall: Emitted 'join-room' for roomId: ${roomId} after connect`);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('VideoCall: Socket disconnected!', reason);
        setSocketConnected(false); // Update state to disconnected
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('VideoCall: Socket connection error:', err.message);
        setSocketConnected(false); // Update state to disconnected on error
      });

      // NEW: Catch generic socket errors
      socketRef.current.on('error', (err) => {
        console.error('VideoCall: Generic Socket error:', err);
      });
    }
    // No need to redeclare socket constant here if it's within the 'if' block.
    // If you need it outside, you'd define it after the 'if' block.
    const socket = socketRef.current;


    // Function to get user media
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Store the stream in a ref, not state, to avoid unnecessary re-renders
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
            console.log("VideoCall: Local video stream assigned to video element."); // NEW: Log for confirmation
        }
        localStreamRef.current = mediaStream; // Store in localStreamRef too

        // REMOVED: Moved 'join-room' event emission to the 'connect' handler for reliability.
        // socket.emit('join-room', roomId);
        // console.log(`VideoCall: Emitted 'join-room' for roomId: ${roomId}`);

        // 3. Listen for Socket.IO events (these stay here)
        socket.on('user-joined', (userId) => {
          console.log(`VideoCall: User ${userId} joined the room. Initiating call.`);
          // Create a new Peer instance to initiate a call to the joined user
          const newPeer = createPeer(userId, socket.id, mediaStream, socket);
          peerRef.current = newPeer; // Store peer instance in ref
        });

        socket.on('receive-call', (payload) => {
          console.log(`VideoCall: Receiving call from ${payload.callerId}.`);
          // Add a new Peer instance to answer the incoming call
          const newPeer = addPeer(payload.signal, mediaStream, socket);
          peerRef.current = newPeer; // Store peer instance in ref
        });

        socket.on('call-accepted', (payload) => {
          console.log(`VideoCall: Call accepted by ${payload.id}. Signaling back.`);
          // Signal the existing peer with the received answer
          if (peerRef.current) {
            peerRef.current.signal(payload.signal);
            console.log("VideoCall: Signaling peer with call-accepted signal.");
          } else {
            console.warn("VideoCall: Peer not yet initialized when call-accepted received. This might be a timing issue.");
          }
        });

        socket.on('chat-message', (msg) => {
          setMessages((prev) => [...prev, msg]);
          console.log("VideoCall: Received chat message:", msg);
        });

        // The 'connect', 'disconnect', 'connect_error' listeners were moved outside this function
        // and into the main useEffect's initial socket setup for clarity and proper lifecycle.

      } catch (error) {
        console.error("VideoCall: Error accessing media devices:", error);
        alert("Could not access camera/microphone. Please ensure permissions are granted and try again.");
      }
    };

    // Call the function to get media when component mounts
    getMedia();

    // 4. Cleanup function: disconnect socket and destroy peer when component unmounts
    return () => {
      console.log("VideoCall component is UNMOUNTING. Cleaning up resources.");

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        console.log("VideoCall: SimplePeer destroyed.");
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("VideoCall: Socket disconnected.");
      }
      // Stop all tracks for the local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        console.log("VideoCall: Local media stream tracks stopped.");
      }
      // Stop remote stream tracks if you manage them (though simple-peer handles this largely)
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
        remoteStreamRef.current = null;
        console.log("VideoCall: Remote media stream tracks stopped.");
      }
    };
  }, [roomId]); // Dependency array: only re-run if roomId changes

  // Function to create a simple-peer instance (initiator)
  const createPeer = (userToSignal, callerId, mediaStream, socketInstance) => {
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: mediaStream,
      // Add STUN/TURN servers if behind NAT. Example:
      // config: {
      //   iceServers: [
      //     { urls: 'stun:stun.l.google.com:19302' },
      //     // { urls: 'turn:YOUR_TURN_SERVER_IP:YOUR_TURN_SERVER_PORT', username: 'YOUR_USERNAME', credential: 'YOUR_PASSWORD' }
      //   ]
      // }
    });

    newPeer.on('signal', (signal) => {
      socketInstance.emit('send-call', { userToSignal, callerId, signal });
      console.log("VideoCall: Emitted 'send-call' signal.");
    });

    newPeer.on('stream', (remoteStream) => {
      console.log('VideoCall: Received remote stream.');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    newPeer.on('connect', () => {
      console.log('VideoCall: Peer connected!');
    });

    newPeer.on('close', () => {
      console.log('VideoCall: Peer closed.');
      // Handle peer closing, e.g., reset remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    newPeer.on('error', (err) => {
      console.error('VideoCall: SimplePeer error:', err);
    });

    return newPeer;
  };

  // Function to add a simple-peer instance (non-initiator, answering a call)
  const addPeer = (incomingSignal, mediaStream, socketInstance) => {
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: mediaStream,
      // Add STUN/TURN servers if behind NAT. Example:
      // config: {
      //   iceServers: [
      //     { urls: 'stun:stun.l.google.com:19302' },
      //   ]
      // }
    });

    newPeer.on('signal', (signal) => {
      socketInstance.emit('accept-call', { callerId: incomingSignal.callerId, signal });
      console.log("VideoCall: Emitted 'accept-call' signal.");
    });

    newPeer.on('stream', (remoteStream) => {
      console.log('VideoCall: Received remote stream.');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    newPeer.on('connect', () => {
      console.log('VideoCall: Peer connected!');
    });

    newPeer.on('close', () => {
      console.log('VideoCall: Peer closed.');
      // Handle peer closing
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    newPeer.on('error', (err) => {
      console.error('VideoCall: SimplePeer error:', err);
    });

    newPeer.signal(incomingSignal); // Signal the peer with the incoming offer
    return newPeer;
  };

  // Toggle local audio track
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    });
    console.log("VideoCall: Audio toggled to:", !audioEnabled);
  };

  // Toggle local video track
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    });
    console.log("VideoCall: Video toggled to:", !videoEnabled);
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
      {/* NEW: Display socket connection status for debugging */}
      <p style={{ color: socketConnected ? 'green' : 'red' }}>
        Socket Status: {socketConnected ? 'Connected' : 'Disconnected'}
      </p>

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