// src/contexts/CallContext.jsx
import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
// Remove simple-peer entirely since we're not using it
import { useSelector } from 'react-redux';
import { useSocket } from './SocketContext'; // Assuming SocketContext provides the socket instance
// Import our custom peer implementation
import { SimplifiedPeer, createPeer } from '../webrtc-replacement.js';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const [call, setCall] = useState(null); // { isReceivingCall: bool, from: userId, name: callerName, signal: signalData, callType: 'audio'|'video' }
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null); // Local media stream
  const [remoteStream, setRemoteStream] = useState(null); // Remote media stream
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [calleeId, setCalleeId] = useState(null); // Added: Store the ID of the user being called
  const [callDuration, setCallDuration] = useState(0); // Added: Call duration in seconds
  const [getUserMediaError, setGetUserMediaError] = useState(null); // Added: State for media errors
  const callTimerRef = useRef(null); // Added: Ref for the interval timer

  // Added: Refs for audio elements
  const ringtoneAudioRef = useRef();

  const myVideoRef = useRef(); // Ref for local video element
  const userVideoRef = useRef(); // Ref for remote video element
  const connectionRef = useRef(); // Ref for the Peer connection instance
  const socket = useSocket(); // Get socket from SocketContext
  const { user: currentUser } = useSelector((state) => state.auth);

  // Helper functions to control audio playback safely
  const playAudio = (audioRef) => {
    audioRef.current?.play().catch(error => console.warn("Audio play prevented:", error));
  };

  const stopAudio = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset playback position
    }
  };

  // --- Get User Media --- (Helper function)
  const getUserMedia = async (constraints) => {
    setGetUserMediaError(null); // Reset error on new attempt
    try {
      console.log('Requesting media with constraints:', constraints);
      const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Got media stream with tracks:', 
        currentStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`).join(', '));
      
      setStream(currentStream);
      
      // Explicitly attach stream to video element if available
      if (myVideoRef.current) {
        console.log('Attaching local stream to video element');
        myVideoRef.current.srcObject = currentStream;
        myVideoRef.current.play().catch(err => console.warn('Could not auto-play local video:', err));
      }
      
      return currentStream;
    } catch (error) {
      console.error("Error accessing media devices.", error);
      let errorMessage = "Could not access media devices.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permission denied. Please allow access to camera/microphone in browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera/microphone found. Please ensure devices are connected.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "Hardware error. Your camera/microphone might be in use by another application.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Requested media constraints cannot be met by available devices.";
      }
      setGetUserMediaError(errorMessage); // Set the error state
      // Reset relevant call state if media is essential for this action
      // resetCallState(); // Consider if a full reset is needed here
      return null;
    }
  };

  // --- Reset Call State --- (Helper function)
  const resetCallState = (notifyPeer = false, recipientId = null) => {
    console.log('Resetting call state');
    stopAudio(ringtoneAudioRef); // Stop ringtone if it was playing

    if (connectionRef.current) {
      connectionRef.current.destroy(); // Destroy peer connection
      connectionRef.current = null;
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop media tracks
        setStream(null);
        if (myVideoRef.current) myVideoRef.current.srcObject = null;
    }
    // Stop the timer
    if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
    }

    if (notifyPeer && recipientId && socket) {
        console.log(`Notifying peer ${recipientId} about call end.`);
        socket.emit('call-ended', { to: recipientId });
    }

    setCall(null);
    setCallAccepted(false);
    setCallEnded(true); // Indicate call has actively ended
    setRemoteStream(null);
    setCallerName('');
    setCallType(null);
    setCalleeId(null); // Reset calleeId
    setCallDuration(0); // Reset duration
    setGetUserMediaError(null); // Reset media error on call end/reset
    setIsMuted(false);
    setIsVideoOff(false);

    // Keep the modal showing 'Ended' briefly by delaying the final state reset
    setTimeout(() => setCallEnded(false), 2000); // Reset after 2s (adjust as needed)
  };

  // --- Call Timer Effect ---
  useEffect(() => {
    if (callAccepted && !callEnded) {
      setCallDuration(0); // Reset timer on acceptance
      callTimerRef.current = setInterval(() => {
        setCallDuration(prevDuration => prevDuration + 1);
      }, 1000);
      console.log("Call timer started.");

      return () => {
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
          callTimerRef.current = null;
          console.log("Call timer stopped.");
        }
      };
    } else {
      // Ensure timer is cleared if call ends or isn't accepted
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
  }, [callAccepted, callEnded]);

  // --- Socket Event Listeners --- (Runs when socket is available)
  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    // Add tracking for last processed signal to prevent duplicates
    const processedSignals = new Set();
    const recentCallAttempts = {};
    let isProcessingCall = false;

    // Listener for incoming calls
    const handleIncomingCall = ({ signal, from, name, callType: type }) => {
      // Prevent duplicate call processing
      const callId = `${from}-${Date.now()}`;
      
      // Check if we've recently processed a call from this user
      const now = Date.now();
      if (recentCallAttempts[from] && now - recentCallAttempts[from] < 2000) {
        console.log(`Ignoring duplicate call from ${name} (${from}) - too frequent`);
        return;
      }
      
      // Record this attempt
      recentCallAttempts[from] = now;
      
      console.log(`Incoming ${type} call from ${name} (${from})`);
      
      // Only process if not already in a call
      if (call || callAccepted || isProcessingCall) {
        console.log(`Already in a call or processing one, ignoring call from ${name}`);
        // Auto-reject if already in a call
        socket.emit('call-ended', { to: from });
        return;
      }
      
      isProcessingCall = true;
      setCall({ isReceivingCall: true, from, name, signal, callType: type });
      setCallerName(name);
      setCallType(type);
      setCallAccepted(false);
      setCallEnded(false);
      setGetUserMediaError(null); // Clear any previous errors
      playAudio(ringtoneAudioRef); // Play ringtone
      isProcessingCall = false;
    };

    // Listener for when the other user accepts the call
    const handleCallAccepted = ({ signal, from }) => {
      console.log(`Call accepted by ${from}`);
      
      // Prevent processing if call already accepted or ended
      if (callAccepted || callEnded) {
        console.log('Ignoring duplicate call acceptance signal');
        return;
      }
      
      setCallAccepted(true);
      
      // Don't set callEnded here, timer effect handles start
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      } else {
         console.error("No connectionRef found when call accepted signal received");
      }
    };

    // Listener for receiving subsequent signals (ICE candidates etc.)
    const handleSignal = ({ signal, from }) => {
        // Deduplicate signals by creating a hash
        if (!signal) return;
        
        const signalHash = JSON.stringify(signal);
        if (processedSignals.has(signalHash)) {
          // Skip duplicate signals
          console.log('Ignoring duplicate signal');
          return;
        }
        
        // Add to processed set (with limit to prevent memory growth)
        processedSignals.add(signalHash);
        if (processedSignals.size > 100) {
          // Clear oldest entries once we reach a reasonable limit
          const entries = Array.from(processedSignals);
          const toRemove = entries.slice(0, 50); // Remove oldest 50
          toRemove.forEach(entry => processedSignals.delete(entry));
        }
        
        // Process the signal
        if (connectionRef.current && !connectionRef.current.destroyed) {
            connectionRef.current.signal(signal);
        } else {
            console.warn("Received signal but no active peer connection or already destroyed.");
        }
    };

    // Listener for when the other user ends the call
    const handleCallEnded = ({ from }) => {
        console.log(`Call ended by peer ${from}`);
        // Don't notify peer back if they initiated the end
        resetCallState(false);
    };

    socket.on('call-incoming', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('signal', handleSignal);
    socket.on('call-ended', handleCallEnded);

    // Cleanup listeners on component unmount or socket change
    return () => {
      socket.off('call-incoming', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('signal', handleSignal);
      socket.off('call-ended', handleCallEnded);
      // Ensure call is ended if component unmounts unexpectedly mid-call
      if (callAccepted && !callEnded) {
          const peerId = call?.from === currentUser._id ? calleeId : call?.from;
          resetCallState(true, peerId); // Notify peer if call was active
      }
    };
  }, [socket, currentUser?._id, callAccepted, callEnded, call, stream, calleeId]); // Added calleeId dependency


  // --- Call Actions --- 

  const initiateCall = async (idToCall, type, calleeName = 'User') => {
    if (!socket || !currentUser?._id) return console.error("Socket or user not available");
    if (callAccepted) return console.warn("Already in a call");

    setCallType(type);
    setCalleeId(idToCall);
    setGetUserMediaError(null); // Reset error before attempt
    const constraints = { video: type === 'video', audio: true };
    const localStream = await getUserMedia(constraints);
    if (!localStream) {
        console.error("getUserMedia failed, cannot initiate call.");
        return; // Exit if media access failed
    }

    setCall({ isReceivingCall: false, from: currentUser._id, name: calleeName });
    setCallerName(calleeName);
    setCallEnded(false);
    setCallAccepted(false);

    try {
        console.log('Creating peer using our simplified implementation');
        // Use our simplified peer implementation
        const peerOptions = {
          initiator: true,
          trickle: true,
          stream: localStream,
          config: { 
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
              // Add free TURN servers - these are essential for NAT traversal
              // especially important when using Render's free tier hosting
              { 
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              },
              {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              },
              {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ],
            iceCandidatePoolSize: 10 // Increase candidate pool size
          }
        };
        
        // Create a peer using our simplified implementation
        const peer = createPeer(peerOptions);
        connectionRef.current = peer;
        
        peer.on('signal', (data) => {
            console.log('[Initiator] Sending signal...');
            socket.emit('call-user', {
                userToCall: idToCall,
                signalData: data,
                from: currentUser._id,
                name: currentUser.name || 'User',
                callType: type,
            });
        });

        peer.on('stream', (remoteStream) => {
            console.log('[Initiator] Received remote stream');
            console.log('Remote stream tracks:', 
              remoteStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`).join(', '));
            
            setRemoteStream(remoteStream);
            
            // Explicitly attach stream to video element if available
            if (userVideoRef.current) {
                console.log('Attaching remote stream to video element');
                userVideoRef.current.srcObject = remoteStream;
                userVideoRef.current.play().catch(err => console.warn('Could not auto-play remote video:', err));
            }
        });

        peer.on('error', (err) => {
          console.error('[Initiator] Peer connection error:', err);
          resetCallState(true, idToCall);
        });

        peer.on('close', () => {
          console.log('[Initiator] Peer connection closed');
          if (callAccepted && !callEnded) {
            resetCallState(false);
          }
        });
    } catch (err) {
        console.error("Error creating peer connection:", err);
        setGetUserMediaError("Failed to establish WebRTC connection: " + err.message);
        resetCallState(false);
    }
  };

  const answerCall = async () => {
    stopAudio(ringtoneAudioRef); // Stop ringtone on answer
    if (!socket || !call || !call.signal) {
        return console.error("Socket or call data not available");
    }
    if (callAccepted) return console.warn("Call already accepted");

    setGetUserMediaError(null); // Reset error before attempt
    const constraints = { video: call.callType === 'video', audio: true };
    const localStream = await getUserMedia(constraints);
    if (!localStream) {
        // If user denies media or hardware error, we can't answer.
        console.warn("getUserMedia failed, cannot answer call.");
        // Error state is set, modal will show it. We should notify the caller.
        resetCallState(true, call.from); // Notify caller we couldn't answer
        return;
    }

    try {
        console.log('Creating receiver peer using simplified implementation');
        // Use our simplified peer implementation
        const peerOptions = {
          initiator: false,
          trickle: true,
          stream: localStream,
          config: { 
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
              // Add free TURN servers - these are essential for NAT traversal
              // especially important when using Render's free tier hosting
              { 
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              },
              {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              },
              {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ],
            iceCandidatePoolSize: 10 // Increase candidate pool size
          }
        };
        
        // Create a peer using our simplified implementation
        const peer = createPeer(peerOptions);
        connectionRef.current = peer;

        peer.on('signal', (data) => {
          console.log('[Receiver] Sending acceptance signal...');
          socket.emit('call-accepted', { signal: data, to: call.from });
        });

        peer.on('stream', (remoteStream) => {
          console.log('[Receiver] Received remote stream');
          console.log('Remote stream tracks:', 
            remoteStream.getTracks().map(t => `${t.kind}:${t.label}:${t.readyState}`).join(', '));
          
          setRemoteStream(remoteStream);
          
          // Explicitly attach stream to video element if available
          if (userVideoRef.current) {
            console.log('Attaching remote stream to video element');
            userVideoRef.current.srcObject = remoteStream;
            userVideoRef.current.play().catch(err => console.warn('Could not auto-play remote video:', err));
          }
        });

        peer.on('error', (err) => {
          console.error('[Receiver] Peer connection error:', err);
          resetCallState(true, call.from); // Notify peer on error
        });

        peer.on('close', () => {
          console.log('[Receiver] Peer connection closed');
          // Check if closed unexpectedly or by leaveCall
          if (callAccepted && !callEnded) {
            resetCallState(false); // Reset without notifying (already closed)
          }
        });

        // Signal the received offer to start the connection process
        console.log('[Receiver] Signaling incoming offer...');
        peer.signal(call.signal);
        
        // Set call as accepted
        setCallAccepted(true);
    } catch (err) {
        console.error("Error creating peer connection for answering:", err);
        setGetUserMediaError("Failed to establish WebRTC connection: " + err.message);
        resetCallState(true, call.from); // Notify caller we couldn't answer
    }
  };

  const leaveCall = () => {
    console.log("Leaving call...");

    // Determine the ID of the person to notify
    let peerIdToNotify = null;
    if (call?.isReceivingCall && !callAccepted) {
        // Declining an incoming call
        peerIdToNotify = call.from;
    } else if (call?.isReceivingCall && callAccepted) {
        // Hanging up a call that we received
        peerIdToNotify = call.from;
    } else if (!call?.isReceivingCall && (callAccepted || (!callAccepted && call))) {
        // Hanging up a call that we initiated (either before or after acceptance)
        peerIdToNotify = calleeId; // Use the stored calleeId
    } else {
        console.warn("LeaveCall: Could not determine peer ID to notify.");
        // Fallback might be needed if context is lost, e.g., page refresh
        // peerIdToNotify = call?.from || calleeId; // Less reliable
    }

    console.log(`Determined peer ID to notify: ${peerIdToNotify}`);
    resetCallState(true, peerIdToNotify);
  };

  const toggleMute = () => {
    if (!stream) return;
    const enabled = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setIsMuted(!enabled);
    console.log(`Audio ${enabled ? 'unmuted' : 'muted'}`);
  };

  const toggleVideo = () => {
    if (!stream || callType !== 'video') return;
    const enabled = !isVideoOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setIsVideoOff(!enabled);
    console.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
  };

  // --- Context Value ---
  const value = {
    call,
    callAccepted,
    callEnded, // Expose callEnded state
    myVideoRef,
    userVideoRef,
    stream,
    remoteStream,
    callerName,
    callType,
    calleeId, // Expose calleeId
    callDuration, // Expose callDuration
    getUserMediaError, // Expose error state
    isMuted,
    isVideoOff,
    initiateCall,
    answerCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    // Added refs for audio elements
    ringtoneAudioRef,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}; 
