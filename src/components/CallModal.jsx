// Enhanced CallModal component with professional design
import React, { useEffect, useState, useRef } from 'react';
import { 
  PhoneIcon, VideoCameraIcon, MicrophoneIcon, VideoCameraSlashIcon, 
  PhoneXMarkIcon, UserCircleIcon, ClockIcon, ExclamationCircleIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOutline, VideoCameraIcon as VideoOutline } from '@heroicons/react/24/outline';
import { useCall } from '../contexts/CallContext';
import { useSelector } from 'react-redux';

// Helper to format seconds into MM:SS
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CallModal = () => {
  const {
    call,
    callAccepted,
    callEnded,
    myVideoRef,
    userVideoRef,
    stream,
    remoteStream,
    callerName,
    callType,
    callDuration,
    isMuted,
    isVideoOff,
    getUserMediaError,
    answerCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    ringtoneAudioRef,
  } = useCall();
  const { user: currentUser } = useSelector((state) => state.auth);

  // Define status variables before using them in the effect
  const showModal = (call || callAccepted) || callEnded;
  const isIncomingCall = call?.isReceivingCall && !callAccepted && !callEnded;
  const isInCall = callAccepted && !callEnded;
  const isInitiatingCall = call && !call.isReceivingCall && !callAccepted && !callEnded;
  const displayCallEnded = callEnded;
  const isVideoCall = callType === 'video';

  // State for fullscreen toggle
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Ref for the modal container
  const modalContainerRef = useRef();

  // Local state to check remote video status
  const [isRemoteVideoActive, setIsRemoteVideoActive] = useState(false);

  // Effect to check remote stream tracks
  useEffect(() => {
    if (remoteStream && isInCall) {
      const videoTracks = remoteStream.getVideoTracks();
      const active = videoTracks.some(track => track.enabled && track.readyState === 'live');
      setIsRemoteVideoActive(active);
    } else {
      setIsRemoteVideoActive(false);
    }
  }, [remoteStream, isInCall]);

  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Exit if not showing
  if (!showModal) {
    return null;
  }

  const getTitle = () => {
    if (displayCallEnded) return 'Call Ended';
    if (getUserMediaError) return 'Media Access Error';
    if (isIncomingCall) return `${callerName || 'Someone'} is calling...`;
    if (isInCall) return `In ${callType} call with ${callerName || 'User'}`;
    if (isInitiatingCall) return `Calling ${callerName || 'User'}...`;
    return 'Call';
  };

  return (
    <div 
      className="fixed inset-0 flex justify-end items-end md:p-8 p-4 z-[100]"
      ref={modalContainerRef}
    >
      {/* Semi-transparent overlay instead of blur */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/75"></div>
      
      {/* Audio Elements */}
      <audio ref={ringtoneAudioRef} src="/sounds/ringtone.mp3" loop preload="auto"></audio>

      {/* Main modal container with enhanced neumorphic design */}
      <div className={`
        relative z-10
        ${isFullscreen ? 'w-full h-full max-w-none p-0' : 'w-full max-w-xl p-6 rounded-2xl'} 
        flex flex-col items-center gap-6 
        bg-[color:var(--bg-base)]
        ${!isFullscreen && 'neumorphic-deep'} 
        transition-all duration-300 ease-in-out
        ${isIncomingCall ? 'animate-pulse-gentle' : ''}
      `}>
        {/* Status Bar */}
        <div className={`
          w-full flex justify-between items-center
          ${isFullscreen ? 'px-6 py-4 bg-[color:var(--bg-base)]/90' : ''}
        `}>
          {/* Title Area */}
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-semibold text-[color:var(--text-primary)]">
              {getTitle()}
            </h2>
            
            {/* Call Duration */}
            {isInCall && !getUserMediaError && (
              <div className="flex items-center space-x-1 text-sm text-[color:var(--primary-accent)]">
                <ClockIcon className="w-3 h-3" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
          
          {/* Fullscreen toggle */}
          {isInCall && !getUserMediaError && (
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full neumorphic-button text-[color:var(--text-secondary)]"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Media Error Display */} 
        {getUserMediaError && (
          <div className="flex flex-col items-center text-center p-5 bg-red-100/90 dark:bg-red-900/30 rounded-xl neumorphic-pressed-danger w-full">
            <ExclamationCircleIcon className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-red-700 dark:text-red-300 font-medium">Could not access camera/microphone.</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{getUserMediaError}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Please check browser permissions and ensure no other app is using the device.</p>
          </div>
        )}

        {/* Video/Audio Area */}
        {!displayCallEnded && !getUserMediaError && (
          <div className={`
            relative w-full 
            ${isVideoCall ? 'aspect-video' : 'h-56'} 
            neumorphic-inset
            rounded-xl overflow-hidden 
            ${isFullscreen ? 'flex-1 rounded-none' : ''}
            border-2 border-[color:var(--bg-base)]/60
          `}>
            {/* Subtle gradient overlay instead of heavy dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20 z-0"></div>
            
            {/* Connection quality indicators */}
            <div className="absolute top-3 left-3 z-30 flex space-x-1 bg-black/20 rounded-full px-2 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-200"></div>
            </div>
            
            {/* Remote Video/Placeholder */}
            {isVideoCall ? (
              <>
                {remoteStream && isRemoteVideoActive ? (
                  <video
                    playsInline
                    ref={userVideoRef}
                    autoPlay
                    className="absolute inset-0 w-full h-full object-cover z-10"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="p-5 rounded-full neumorphic-circle bg-[color:var(--bg-base)]/5 mb-3">
                      <UserCircleIcon className="w-16 h-16 text-[color:var(--primary-accent)] opacity-80" />
                    </div>
                    <p className="text-center px-4 text-[color:var(--text-secondary)] font-medium">
                      {isInCall && remoteStream && !isRemoteVideoActive
                        ? `${callerName || 'Partner'} has turned off their video`
                        : isInCall
                        ? "Waiting for partner's video..."
                        : isIncomingCall
                        ? "Incoming video call..."
                        : "Connecting..."}
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Audio Call Visualization - Enhanced neumorphic effect
              <div className="w-full h-full flex flex-col items-center justify-center z-10">
                <div className="neumorphic-circle-concentric relative">
                  <div className="absolute -inset-6 rounded-full animate-pulse-slow opacity-50"></div>
                  <div className="relative p-6 rounded-full">
                    <PhoneIcon className="w-14 h-14 text-[color:var(--primary-accent)]" />
                  </div>
                </div>
                <p className="text-[color:var(--text-secondary)] mt-5 font-medium">
                  {isInCall
                    ? `In call with ${callerName}`
                    : isIncomingCall
                    ? "Incoming audio call..."
                    : "Connecting..."}
                </p>
              </div>
            )}

            {/* My Video Preview - Enhanced with better neumorphic styling */}
            {stream && isVideoCall && (
              <div className={`
                absolute bottom-3 right-3 
                w-1/4 max-w-[120px] md:max-w-[160px] 
                aspect-video rounded-lg z-20 
                ${isVideoOff ? 'neumorphic-mini-raised bg-black/70' : 'neumorphic-mini-pressed'}
                border-2 border-[color:var(--primary-accent)]/40
                overflow-hidden 
                transition-transform duration-300
                hover:scale-105
              `}>
                <video
                  playsInline
                  muted
                  ref={myVideoRef}
                  autoPlay
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoCameraSlashIcon className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                {isMuted && (
                  <div className="absolute top-1 left-1 p-1 bg-black/50 rounded-full">
                    <MicrophoneIcon className="w-3 h-3 text-yellow-400"/>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Controls Area - Enhanced neumorphic buttons */}
        {!displayCallEnded && !getUserMediaError && (
          <div className={`
            flex justify-center items-center 
            space-x-4 md:space-x-6 
            w-full py-4
            ${isFullscreen ? 'bg-[color:var(--bg-base)]/90 py-6' : ''}
          `}>
            {isIncomingCall ? (
              // Incoming Call Actions - Enhanced buttons
              <>
                <button
                  onClick={answerCall}
                  className="p-5 rounded-full 
                    neumorphic-button-success
                    hover:shadow-lg
                    transition-all duration-300
                    hover:scale-105 active:scale-95"
                  aria-label="Answer call"
                >
                  {isVideoCall ? 
                    <VideoCameraIcon className="h-7 w-7" /> : 
                    <PhoneIcon className="h-7 w-7" />
                  }
                </button>
                <button
                  onClick={leaveCall}
                  className="p-5 rounded-full 
                    neumorphic-button-danger
                    hover:shadow-lg
                    transition-all duration-300
                    hover:scale-105 active:scale-95"
                  aria-label="Decline call"
                >
                  <PhoneXMarkIcon className="h-7 w-7" />
                </button>
              </>
            ) : (
              // In-Call/Initiating Controls - Enhanced neumorphic styling
              <>
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className={`
                    p-4 md:p-5
                    rounded-full 
                    transition-all duration-300
                    ${isMuted 
                      ? 'neumorphic-button-active' 
                      : 'neumorphic-button'
                    }
                    hover:scale-105 active:scale-95
                  `}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicrophoneIcon className="h-6 w-6" /> : <MicOutline className="h-6 w-6" />}
                </button>

                {/* Video Toggle Button */}
                {isVideoCall && (
                  <button
                    onClick={toggleVideo}
                    className={`
                      p-4 md:p-5
                      rounded-full 
                      transition-all duration-300
                      ${isVideoOff 
                        ? 'neumorphic-button-active' 
                        : 'neumorphic-button'
                      }
                      hover:scale-105 active:scale-95
                    `}
                    aria-label={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                  >
                    {isVideoOff ? <VideoCameraSlashIcon className="h-6 w-6" /> : <VideoOutline className="h-6 w-6" />}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={leaveCall}
                  className="p-4 md:p-5 rounded-full 
                    neumorphic-button-danger
                    transition-all duration-300
                    hover:scale-105 active:scale-95"
                  aria-label="End call"
                >
                  <PhoneXMarkIcon className="h-6 w-6 md:h-7 md:w-7" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Call Ended Message - Enhanced with neumorphic styling */} 
        {displayCallEnded && (
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 neumorphic-circle-danger flex items-center justify-center mb-5">
              <PhoneXMarkIcon className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-lg text-[color:var(--text-primary)] font-medium">
              Call Ended
            </p>
            <p className="text-sm text-[color:var(--text-secondary)] mt-2">
              The call has been disconnected.
            </p>
          </div>
        )}
        
        {/* Error state close button */}
        {getUserMediaError && (
          <button
            onClick={leaveCall}
            className="mt-4 px-6 py-3 rounded-lg neumorphic-button-danger
              transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default CallModal; 